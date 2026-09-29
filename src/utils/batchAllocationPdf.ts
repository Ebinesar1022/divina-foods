import jsPDF from "jspdf";
import autoTable, { type CellHookData } from "jspdf-autotable";
import { DIVINA_LOGO_PNG_BASE64 } from "../assets/logoBase64";
import type { BatchAllocationLine, FinishedGoodTargetRow, MrpRow, ProductionTargetRow, RawMaterialNeedRow } from "../types";
import { expiryTime, type FinishedGoodBatchSection } from "./finishedGoodBreakdown";

// Mirrors the grouping BatchAllocationSummary already computes on screen —
// passed straight in from there so the PDF always matches what's displayed,
// rather than re-deriving the productName/productId matching logic here too.
export interface BatchAllocationPdfGroup {
  key: string;
  lines: BatchAllocationLine[];
  material?: RawMaterialNeedRow;
  fallbackName?: string;
}

type RGB = [number, number, number];

// ───────────── Divina Artisan Beige & Forest Green Palette ─────────────
const COLOR_BRAND_GREEN: RGB = [20, 83, 45]; // #14532d forest green (primary)
const COLOR_BRAND_OLIVE: RGB = [64, 145, 108]; // #40916c olive (accent)
const COLOR_GREEN_TINT: RGB = [238, 245, 239]; // #eef5ef table head / soft fills
const COLOR_GREEN_PILL: RGB = [214, 236, 221]; // #d6ecdd chip on the dark band

const COLOR_BEIGE_HEADER: RGB = [250, 247, 242]; // #faf7f2 warm ivory linen
const COLOR_PANEL_BG: RGB = [252, 250, 246]; // #fcfaf6 soft cream panel
const COLOR_BORDER: RGB = [222, 215, 202]; // #ded7ca warm stone border
const COLOR_HAIRLINE: RGB = [236, 231, 221]; // #ece7dd row separators

const COLOR_TEXT_MAIN: RGB = [28, 25, 23]; // #1c1917 warm charcoal
const COLOR_TEXT_MUTED: RGB = [113, 106, 100]; // #716a64 warm stone gray
const COLOR_TEXT_LIGHT: RGB = [160, 154, 149]; // #a09a95 light stone

const SAGE_PILL_BG: RGB = [240, 253, 244]; // #f0fdf4
const SAGE_PILL_BORDER: RGB = [187, 247, 208]; // #bbf7d0
const SAGE_PILL_TEXT: RGB = [20, 83, 45]; // #14532d

const AMBER_BG: RGB = [254, 243, 199]; // #fef3c7
const AMBER_BORDER: RGB = [253, 224, 130];
const AMBER_TEXT: RGB = [161, 72, 6]; // #a14806

const RED_TEXT: RGB = [185, 28, 28]; // #b91c1c

// The logo PNG is a 500x500 canvas with the wordmark in a thin band across
// the middle, so drawn as-is it prints tiny. This is the wordmark's bounding
// box in source pixels; drawLogo clips to it so the logo can be sized by the
// width it should actually occupy.
const LOGO_PX = 500;
const LOGO_CROP = { x: 36, y: 196, w: 428, h: 108 };

// Batches expiring within this many days are flagged amber on the pick list
// (already-expired ones red).
const EXPIRY_WARN_DAYS = 14;
const QTY_TOLERANCE = 0.01;

function formatDateForPdf(value: string | undefined): string {
  if (!value) return "—";
  if (!/^\d{4}-\d{2}-\d{2}/.test(value)) return value;
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });
}

function formatQty(value: number | undefined): string {
  if (value == null || isNaN(value)) return "—";
  return value.toFixed(2).replace(/\.00$/, "");
}

function roundQty(value: number): number {
  return Math.round((value + Number.EPSILON) * 10000) / 10000;
}

// jsPDF can't crop an image, so draw the full PNG scaled up and clip to the
// wordmark's box.
function drawLogo(doc: jsPDF, x: number, y: number, width: number): number {
  const scale = width / LOGO_CROP.w;
  const height = LOGO_CROP.h * scale;
  try {
    doc.saveGraphicsState();
    doc.rect(x, y, width, height, null);
    doc.clip();
    doc.discardPath();
    doc.addImage(
      DIVINA_LOGO_PNG_BASE64,
      "PNG",
      x - LOGO_CROP.x * scale,
      y - LOGO_CROP.y * scale,
      LOGO_PX * scale,
      LOGO_PX * scale,
      "divina-logo",
      "FAST",
    );
    doc.restoreGraphicsState();
  } catch {
    doc.restoreGraphicsState();
    doc.setTextColor(...COLOR_BRAND_GREEN);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(Math.max(10, height * 0.6));
    doc.text("DIVINA", x, y + height * 0.75);
  }
  return height;
}

const WATERMARK_SIZE = 470;
// As jsPDF takes it: counter-clockwise degrees, so a negative angle tilts the
// mark down to the right.
const WATERMARK_ANGLE = -38;

// Top-left (x, y) to hand to addImage so that, once rotated, the image's
// centre sits exactly on the page centre. jsPDF does NOT rotate about the
// image's centre — it translates to the image's bottom-left corner, rotates
// there, then draws the image — so the centre has to be solved for:
//   centre = (x + s/2·(cos − sin),  y + s − s/2·(sin + cos))   [y down]
export function watermarkOrigin(
  pageWidth: number,
  pageHeight: number,
  size = WATERMARK_SIZE,
  angleDeg = WATERMARK_ANGLE,
): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    x: pageWidth / 2 - (size / 2) * (cos - sin),
    y: pageHeight / 2 - size + (size / 2) * (sin + cos),
  };
}

// Faint diagonal brand mark. Drawn as the FIRST thing on every page so it
// sits behind the content instead of dimming the figures it overlaps.
function drawWatermark(doc: jsPDF, pageWidth: number, pageHeight: number) {
  try {
    if (typeof (doc as any).GState !== "function") return;
    (doc as any).setGState(new (doc as any).GState({ opacity: 0.06 }));
    const { x, y } = watermarkOrigin(pageWidth, pageHeight);
    doc.addImage(
      DIVINA_LOGO_PNG_BASE64,
      "PNG",
      x,
      y,
      WATERMARK_SIZE,
      WATERMARK_SIZE,
      "divina-logo",
      "FAST",
      WATERMARK_ANGLE,
    );
    (doc as any).setGState(new (doc as any).GState({ opacity: 1 }));
  } catch (err) {
    console.warn("Watermark rendering error:", err);
  }
}

interface PillStyle {
  bg: RGB;
  border?: RGB;
  text: RGB;
}

const PILL_SAGE: PillStyle = { bg: SAGE_PILL_BG, border: SAGE_PILL_BORDER, text: SAGE_PILL_TEXT };
const PILL_AMBER: PillStyle = { bg: AMBER_BG, border: AMBER_BORDER, text: AMBER_TEXT };
const PILL_ON_DARK: PillStyle = { bg: COLOR_GREEN_PILL, text: COLOR_BRAND_GREEN };

// Rounded label. (x, y) is the pill's top-left; returns its width so callers
// can right-align or chain pills.
function drawPill(
  doc: jsPDF,
  x: number,
  y: number,
  text: string,
  style: PillStyle,
  fontSize = 7.5,
  height = 15,
  align: "left" | "right" = "left",
): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(fontSize);
  const width = doc.getTextWidth(text) + 14;
  const left = align === "right" ? x - width : x;
  doc.setFillColor(...style.bg);
  if (style.border) {
    doc.setDrawColor(...style.border);
    doc.setLineWidth(0.6);
    doc.roundedRect(left, y, width, height, height / 2, height / 2, "FD");
  } else {
    doc.roundedRect(left, y, width, height, height / 2, height / 2, "F");
  }
  doc.setTextColor(...style.text);
  doc.text(text, left + 7, y + height / 2 + fontSize * 0.34);
  return width;
}

// One printed row of a material's pick list.
interface RowMeta {
  groupEnd: boolean;
  expiry: "ok" | "soon" | "expired";
}

// What the first (rowSpan) cell of a material needs to draw itself.
interface MaterialCellMeta {
  nameLines: string[];
  subline: string;
  short: number;
}

export function createBatchAllocationPdf(params: {
  productionTarget: ProductionTargetRow;
  mrpRecord: MrpRow | null;
  groups: BatchAllocationPdfGroup[];
  finishedGoods: FinishedGoodTargetRow[];
  // The same batches split per finished good. When present the report lists
  // each finished good with the materials/batches to pick for it; `groups`
  // still drives the summary counts and is the fallback when this is absent.
  finishedGoodSections?: FinishedGoodBatchSection[];
}): { blob: Blob; filename: string } {
  const { productionTarget, mrpRecord, groups, finishedGoods, finishedGoodSections } = params;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 36;
  const contentWidth = pageWidth - marginX * 2;
  const bottomMargin = 48;
  const continuationTop = 62;
  let cursorY = 0;

  const targetIdStr = productionTarget.productionTargetId || "REPORT";
  const useSections = !!finishedGoodSections && finishedGoodSections.length > 0;
  const today = new Date();
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());

  doc.setProperties({
    title: `Batch Allocation Report ${targetIdStr}`,
    subject: "FEFO batch allocation / pick list",
    author: "Divina Foods",
    creator: "Divina Foods Production Overview",
  });

  // ── Page furniture ──
  // Every page after the first gets the watermark and a slim running header
  // the moment it's created — jsPDF-AutoTable adds its overflow pages through
  // doc.addPage() too, so wrapping it covers both.
  function drawContinuationHeader() {
    doc.setFillColor(...COLOR_BRAND_GREEN);
    doc.rect(0, 0, pageWidth * 0.7, 3, "F");
    doc.setFillColor(...COLOR_BRAND_OLIVE);
    doc.rect(pageWidth * 0.7, 0, pageWidth * 0.3, 3, "F");

    drawLogo(doc, marginX, 15, 92);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...COLOR_TEXT_MUTED);
    doc.text("BATCH ALLOCATION REPORT", pageWidth - marginX, 24, { align: "right" });
    doc.setFontSize(10);
    doc.setTextColor(...COLOR_BRAND_GREEN);
    doc.text(targetIdStr, pageWidth - marginX, 37, { align: "right" });

    doc.setDrawColor(...COLOR_BORDER);
    doc.setLineWidth(0.6);
    doc.line(marginX, 48, pageWidth - marginX, 48);
  }

  const rawAddPage = doc.addPage.bind(doc);
  (doc as any).addPage = function (...args: any[]) {
    const result = (rawAddPage as any)(...args);
    drawWatermark(doc, pageWidth, pageHeight);
    drawContinuationHeader();
    cursorY = continuationTop;
    return result;
  };

  function ensureSpace(needed: number) {
    if (cursorY + needed > pageHeight - bottomMargin) doc.addPage();
  }

  // ── 1. Header band ──
  drawWatermark(doc, pageWidth, pageHeight);

  const barHeight = 5;
  const headerHeight = 88;
  doc.setFillColor(...COLOR_BRAND_GREEN);
  doc.rect(0, 0, pageWidth * 0.7, barHeight, "F");
  doc.setFillColor(...COLOR_BRAND_OLIVE);
  doc.rect(pageWidth * 0.7, 0, pageWidth * 0.3, barHeight, "F");

  doc.setFillColor(...COLOR_BEIGE_HEADER);
  doc.rect(0, barHeight, pageWidth, headerHeight, "F");
  doc.setDrawColor(...COLOR_BORDER);
  doc.setLineWidth(0.75);
  doc.line(0, barHeight + headerHeight, pageWidth, barHeight + headerHeight);

  const logoWidth = 158;
  const logoHeight = (LOGO_CROP.h * logoWidth) / LOGO_CROP.w;
  drawLogo(doc, marginX, barHeight + (headerHeight - logoHeight) / 2, logoWidth);

  const generatedOn = new Date().toLocaleString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const rightX = pageWidth - marginX;
  // jsPDF's right-align ignores letter-spacing, so measure it ourselves.
  const titleLabel = "BATCH ALLOCATION REPORT";
  const titleSpacing = 1.2;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...COLOR_BRAND_OLIVE);
  doc.setCharSpace(0);
  const titleLabelWidth = doc.getTextWidth(titleLabel) + titleSpacing * (titleLabel.length - 1);
  doc.setCharSpace(titleSpacing);
  doc.text(titleLabel, rightX - titleLabelWidth, 30);
  doc.setCharSpace(0);

  doc.setFontSize(25);
  doc.setTextColor(...COLOR_BRAND_GREEN);
  doc.text(targetIdStr, rightX, 58, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...COLOR_TEXT_MUTED);
  doc.text(`Generated ${generatedOn}`, rightX, 76, { align: "right" });

  cursorY = barHeight + headerHeight + 20;

  // ── 2. Summary card: run details + at-a-glance numbers ──
  const cardPad = 16;
  const metaRowH = 36;
  const kpiH = 58;
  const dividerY = cardPad + metaRowH * 2 + 2;
  const cardHeight = dividerY + kpiH;
  const cardTop = cursorY;

  doc.setFillColor(...COLOR_PANEL_BG);
  doc.setDrawColor(...COLOR_BORDER);
  doc.setLineWidth(0.75);
  doc.roundedRect(marginX, cardTop, contentWidth, cardHeight, 8, 8, "FD");

  const metaColW = (contentWidth - cardPad * 2) / 3;
  const metaFields: Array<{ label: string; value: string; isStatus?: boolean }> = [
    { label: "PRODUCTION TARGET", value: targetIdStr },
    { label: "MRP ID", value: mrpRecord?.mrpId || "—" },
    { label: "STATUS", value: productionTarget.status || "—", isStatus: true },
    { label: "ASSIGNED TO", value: productionTarget.assignedTo || "Unassigned" },
    { label: "START DATE", value: formatDateForPdf(productionTarget.startDate) },
    { label: "END DATE", value: formatDateForPdf(productionTarget.endDate) },
  ];

  metaFields.forEach((item, idx) => {
    const x = marginX + cardPad + (idx % 3) * metaColW;
    const y = cardTop + cardPad + Math.floor(idx / 3) * metaRowH + 6;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...COLOR_TEXT_LIGHT);
    doc.setCharSpace(0.6);
    doc.text(item.label, x, y);
    doc.setCharSpace(0);

    if (item.isStatus) {
      const waiting = item.value.toLowerCase().includes("waiting");
      drawPill(doc, x, y + 5, item.value, waiting ? PILL_AMBER : PILL_SAGE, 8.5, 16);
    } else {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(...COLOR_TEXT_MAIN);
      doc.text(item.value, x, y + 16);
    }
  });

  doc.setDrawColor(...COLOR_HAIRLINE);
  doc.setLineWidth(0.75);
  doc.line(marginX + cardPad, cardTop + dividerY, marginX + contentWidth - cardPad, cardTop + dividerY);

  const materialTotals = groups.map((g) => ({
    allocated: roundQty(g.lines.reduce((sum, l) => sum + (l.batchQty || 0), 0)),
    required: g.material ? g.material.stockRequired : undefined,
  }));
  const shortMaterials = materialTotals.filter(
    (t) => t.required != null && t.allocated < t.required - QTY_TOLERANCE,
  ).length;
  const uniqueBatches = new Set(
    groups.flatMap((g) => g.lines.map((l) => l.batchNumber || l.batchId)).filter(Boolean),
  ).size;
  const fgCount = useSections ? finishedGoodSections!.length : finishedGoods.length;

  const kpis: Array<{ label: string; value: string; tone: "green" | "amber" }> = [
    { label: "FINISHED GOODS", value: String(fgCount), tone: "green" },
    { label: "RAW MATERIALS", value: String(groups.length), tone: "green" },
    { label: "BATCHES TO PICK", value: String(uniqueBatches), tone: "green" },
    {
      label: "ALLOCATION",
      value: shortMaterials > 0 ? `${shortMaterials} short` : "All covered",
      tone: shortMaterials > 0 ? "amber" : "green",
    },
  ];
  const kpiW = (contentWidth - cardPad * 2) / kpis.length;
  kpis.forEach((kpi, idx) => {
    const x = marginX + cardPad + idx * kpiW;
    if (idx > 0) {
      doc.setDrawColor(...COLOR_HAIRLINE);
      doc.line(x - 8, cardTop + dividerY + 12, x - 8, cardTop + cardHeight - 12);
    }
    const isText = idx === kpis.length - 1;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(isText ? 13.5 : 20);
    doc.setTextColor(...(kpi.tone === "amber" ? AMBER_TEXT : COLOR_BRAND_GREEN));
    doc.text(kpi.value, x, cardTop + dividerY + 30);

    doc.setFontSize(7);
    doc.setTextColor(...COLOR_TEXT_LIGHT);
    doc.setCharSpace(0.6);
    doc.text(kpi.label, x, cardTop + dividerY + 44);
    doc.setCharSpace(0);
  });

  cursorY = cardTop + cardHeight + 24;

  // ── 3. Finished goods overview (only when there are no per-finished-good
  // sections — those each carry their own heading and target quantity) ──
  const tableBase = {
    theme: "plain" as const,
    styles: {
      font: "helvetica",
      fontSize: 9,
      textColor: COLOR_TEXT_MAIN,
      cellPadding: { top: 7, bottom: 7, left: 8, right: 8 },
      lineColor: COLOR_HAIRLINE,
      lineWidth: { bottom: 0.6 },
      valign: "middle" as const,
    },
    margin: { top: continuationTop, bottom: bottomMargin, left: marginX, right: marginX },
  };

  if (!useSections && finishedGoods.length > 0) {
    ensureSpace(120);
    doc.setTextColor(...COLOR_BRAND_GREEN);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Finished Goods", marginX, cursorY + 6);
    cursorY += 16;

    autoTable(doc, {
      ...tableBase,
      startY: cursorY,
      head: [["ITEM", "UOM", { content: "TARGET QUANTITY", styles: { halign: "right" } }]],
      body: finishedGoods.map((fg) => [fg.itemName, fg.uomName, formatQty(fg.targetQuantity)]),
      headStyles: {
        fillColor: COLOR_GREEN_TINT,
        textColor: COLOR_BRAND_GREEN,
        fontStyle: "bold",
        fontSize: 7.5,
        lineColor: COLOR_BORDER,
        lineWidth: { bottom: 0.9 },
      },
      columnStyles: {
        0: { fontStyle: "bold", textColor: COLOR_BRAND_GREEN },
        1: { textColor: COLOR_TEXT_MUTED },
        2: { halign: "right", fontStyle: "bold" },
      },
    });

    cursorY = (doc as any).lastAutoTable.finalY + 24;
  }

  // ── 4. Pick lists ──
  // One compact table per finished good (or one combined table as the
  // fallback): a dark title band, a light column-header row, then each
  // material with its batches stacked beside it. The band is part of the
  // table's head, so it repeats on every page the table runs onto.
  const COL = { batch: 84, expiry: 80, pick: 62, left: 66, picked: 58 };
  const materialColW = contentWidth - (COL.batch + COL.expiry + COL.pick + COL.left + COL.picked);
  const cellPadX = 8;

  function fitLines(text: string, maxWidth: number, maxLines: number): string[] {
    const lines: string[] = doc.splitTextToSize(text, maxWidth);
    if (lines.length <= maxLines) return lines;
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = kept[maxLines - 1].replace(/\s*\S{0,2}$/, "") + "…";
    return kept;
  }

  function drawPickList(opts: {
    index?: number;
    title: string;
    chip: string;
    sectionGroups: BatchAllocationPdfGroup[];
  }) {
    const { index, title, chip, sectionGroups } = opts;

    // Band: index badge + title (up to 2 lines) + right-hand target chip.
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    const chipWidth = doc.getTextWidth(chip) + 14;
    const badgeSpace = index != null ? 34 : 0;
    const titleMaxW = contentWidth - 20 - badgeSpace - chipWidth - 16;
    doc.setFontSize(12);
    const titleLines = fitLines(title, titleMaxW, 2);
    const bandHeight = titleLines.length > 1 ? 44 : 32;

    const rowMeta: RowMeta[] = [];
    const body: any[] = [];

    sectionGroups.forEach((group) => {
      const name = group.material?.productName || group.fallbackName || "Unknown Material";
      const uom = group.material?.uom || "";
      const required = group.material?.stockRequired;
      const allocated = roundQty(group.lines.reduce((sum, l) => sum + (l.batchQty || 0), 0));
      const short =
        required != null && allocated < required - QTY_TOLERANCE ? roundQty(required - allocated) : 0;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      const nameLines = fitLines(name, materialColW - cellPadX * 2, 3);
      const subline = [uom, required != null ? `Required ${formatQty(required)}` : ""]
        .filter(Boolean)
        .join("  ·  ");

      const meta: MaterialCellMeta = { nameLines, subline, short };
      const lines: Array<BatchAllocationLine | null> = group.lines.length > 0 ? group.lines : [null];

      lines.forEach((line, li) => {
        const row: any[] = [];
        if (li === 0) {
          row.push({
            // Placeholder lines only reserve the height; didDrawCell paints
            // the two-style text (name + muted detail line).
            // One extra line when a SHORT pill has to fit under the detail line.
            content: "\n".repeat(nameLines.length + (short > 0 ? 1 : 0)),
            rowSpan: lines.length,
            styles: { fontSize: 9.5, valign: "top" },
            _meta: meta,
          });
        }
        if (!line) {
          row.push({
            content: "No batch allocated",
            colSpan: 5,
            styles: { textColor: AMBER_TEXT, fontStyle: "italic" },
          });
          rowMeta.push({ groupEnd: true, expiry: "ok" });
        } else {
          const t = expiryTime(line.expiryDate);
          const daysLeft = isFinite(t) ? Math.round((t - todayUtc) / 86400000) : Infinity;
          const expiry: RowMeta["expiry"] =
            daysLeft < 0 ? "expired" : daysLeft <= EXPIRY_WARN_DAYS ? "soon" : "ok";
          row.push(
            line.batchNumber || (line.batchId ? `#${line.batchId.slice(-6)}` : "—"),
            formatDateForPdf(line.expiryDate),
            formatQty(line.batchQty),
            formatQty(line.remainingQty),
            "",
          );
          rowMeta.push({ groupEnd: li === lines.length - 1, expiry });
        }
        body.push(row);
      });
    });

    ensureSpace(bandHeight + 22 + 56);

    autoTable(doc, {
      ...tableBase,
      startY: cursorY,
      rowPageBreak: "avoid",
      head: [
        [{ content: "", colSpan: 6, styles: { minCellHeight: bandHeight, fillColor: COLOR_BRAND_GREEN, lineWidth: 0 } }],
        ["MATERIAL", "BATCH NO.", "EXPIRY", "PICK QTY", "BATCH LEFT", "PICKED"],
      ],
      body,
      headStyles: {
        fillColor: COLOR_GREEN_TINT,
        textColor: COLOR_BRAND_GREEN,
        fontStyle: "bold",
        fontSize: 7,
        cellPadding: { top: 6, bottom: 6, left: cellPadX, right: cellPadX },
        lineColor: COLOR_BORDER,
        lineWidth: { bottom: 0.9 },
      },
      columnStyles: {
        0: { cellWidth: materialColW },
        1: { cellWidth: COL.batch, fontStyle: "bold", textColor: COLOR_BRAND_GREEN },
        2: { cellWidth: COL.expiry, textColor: COLOR_TEXT_MUTED },
        3: { cellWidth: COL.pick, halign: "right", fontStyle: "bold", fontSize: 10.5, textColor: COLOR_BRAND_GREEN },
        4: { cellWidth: COL.left, halign: "right", textColor: COLOR_TEXT_MUTED },
        5: { cellWidth: COL.picked },
      },
      didParseCell(data: CellHookData) {
        if (data.section === "head") {
          // Column labels line up with the values beneath them.
          if (data.row.index === 1) {
            data.cell.styles.halign = data.column.index === 3 || data.column.index === 4 ? "right" : data.column.index === 5 ? "center" : "left";
          }
          return;
        }
        if (data.section !== "body") return;

        const lastRow = data.row.index + (data.cell.rowSpan || 1) - 1;
        if (rowMeta[lastRow]?.groupEnd) {
          data.cell.styles.lineColor = COLOR_BORDER;
          data.cell.styles.lineWidth = { bottom: 0.9 };
        }
        if (data.column.index === 2) {
          const state = rowMeta[data.row.index]?.expiry;
          if (state === "soon") {
            data.cell.styles.textColor = AMBER_TEXT;
          } else if (state === "expired") {
            data.cell.styles.textColor = RED_TEXT;
            data.cell.styles.fontStyle = "bold";
          }
        }
      },
      didDrawCell(data: CellHookData) {
        const { cell } = data;

        if (data.section === "head" && data.row.index === 0 && data.column.index === 0) {
          const midY = cell.y + cell.height / 2;
          let textX = cell.x + 14;
          if (index != null) {
            doc.setFillColor(255, 255, 255);
            doc.circle(cell.x + 26, midY, 10, "F");
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.setTextColor(...COLOR_BRAND_GREEN);
            doc.text(String(index), cell.x + 26, midY + 3.5, { align: "center" });
            textX = cell.x + 46;
          }
          doc.setFont("helvetica", "bold");
          doc.setFontSize(12);
          doc.setTextColor(255, 255, 255);
          const lineGap = 14;
          const firstY = midY - ((titleLines.length - 1) * lineGap) / 2 + 4.2;
          titleLines.forEach((tl, i) => doc.text(tl, textX, firstY + i * lineGap));
          drawPill(doc, cell.x + cell.width - 14, midY - 8.5, chip, PILL_ON_DARK, 9, 17, "right");
          return;
        }

        if (data.section !== "body") return;

        if (data.column.index === 0) {
          const meta = (cell.raw as any)?._meta as MaterialCellMeta | undefined;
          if (!meta) return;
          const x = cell.x + cellPadX;
          let y = cell.y + 7 + 8.2;
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9.5);
          doc.setTextColor(...COLOR_TEXT_MAIN);
          meta.nameLines.forEach((nl) => {
            doc.text(nl, x, y);
            y += 11;
          });
          if (meta.subline) {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(7.5);
            doc.setTextColor(...COLOR_TEXT_MUTED);
            doc.text(meta.subline, x, y + 0.5);
          }
          if (meta.short > 0) {
            drawPill(doc, x, y + 4.5, `SHORT ${formatQty(meta.short)}`, PILL_AMBER, 6.8, 11.5);
          }
          return;
        }

        // Tick box for staff to mark a batch as picked.
        if (data.column.index === 5) {
          const box = 11;
          const bx = cell.x + (cell.width - box) / 2;
          const by = cell.y + (cell.height - box) / 2;
          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(...COLOR_TEXT_LIGHT);
          doc.setLineWidth(0.9);
          doc.roundedRect(bx, by, box, box, 2, 2, "FD");
        }
      },
    });

    cursorY = (doc as any).lastAutoTable.finalY + 22;
  }

  if (useSections) {
    finishedGoodSections!.forEach((section, i) => {
      if (section.groups.length === 0) return;
      const fg = section.finishedGood;
      drawPickList({
        index: i + 1,
        title: fg.itemName,
        chip: `Target  ${formatQty(fg.targetQuantity)}${fg.uomName ? ` ${fg.uomName}` : ""}`,
        sectionGroups: section.groups,
      });
    });
  } else {
    drawPickList({
      title: "Combined allocation — all finished goods",
      chip: `${groups.length} ${groups.length === 1 ? "material" : "materials"}`,
      sectionGroups: groups,
    });
  }

  // ── 5. Footer on every page ──
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    doc.setDrawColor(...COLOR_BORDER);
    doc.setLineWidth(0.5);
    doc.line(marginX, pageHeight - 34, pageWidth - marginX, pageHeight - 34);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...COLOR_TEXT_LIGHT);
    doc.text(
      `DIVINA FOODS  •  ARTISAN PIZZA BASES  •  ${targetIdStr}${mrpRecord?.mrpId ? `  •  ${mrpRecord.mrpId}` : ""}`,
      marginX,
      pageHeight - 20,
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...COLOR_BRAND_GREEN);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - marginX, pageHeight - 20, { align: "right" });
  }

  const safeId = targetIdStr.replace(/[^\w-]+/g, "_");
  const filename = `Batch_Allocation_${safeId}.pdf`;

  return { blob: doc.output("blob"), filename };
}

// Plain browser download. Fine on desktop, but the Creator mobile app's
// webview hands a `blob:` download to the host app, which ignores it — so
// on phones the caller uploads the PDF to Creator instead (see
// uploadBatchAllocationPdf in productionApi.ts). Kept as the desktop path.
export function saveBatchAllocationPdf(blob: Blob, filename: string): void {
  const pdfUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = pdfUrl;
  link.download = filename;
  link.rel = "noopener";
  // Only iOS Safari needs `target="_blank"` (it shows the PDF in a new tab
  // to save/share from). Android webviews can't open new windows, which
  // makes it drop the click.
  if (!/Android/i.test(navigator.userAgent)) link.target = "_blank";
  document.body.appendChild(link);
  link.click();
  link.remove();

  // Mobile PDF viewers may start reading the Blob after the click event.
  window.setTimeout(() => URL.revokeObjectURL(pdfUrl), 60_000);
}

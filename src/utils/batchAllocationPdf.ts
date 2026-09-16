import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { DIVINA_LOGO_BASE64 } from "../assets/logoBase64";
import type { BatchAllocationLine, FinishedGoodTargetRow, MrpRow, ProductionTargetRow, RawMaterialNeedRow } from "../types";

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
// Forest & Olive Greens (inspired by the Divina logo)
const COLOR_BRAND_GREEN: RGB = [20, 83, 45]; // #14532d (primary forest green)
const COLOR_BRAND_OLIVE: RGB = [64, 145, 108]; // #40916c (olive sub-accent)
const COLOR_SLATE_GREEN: RGB = [26, 46, 35]; // #1a2e23 (deep dark header)

// Warm Artisan Beige & Cream
const COLOR_BEIGE_HEADER: RGB = [250, 247, 242]; // #faf7f2 (warm ivory linen)
const COLOR_PANEL_BG: RGB = [252, 250, 246]; // #fcfaf6 (soft cream panel)
const COLOR_ROW_ALT: RGB = [251, 249, 245]; // #fbf9f5 (subtle warm row)
const COLOR_BORDER: RGB = [228, 222, 210]; // #e4ded2 (warm stone border)
const COLOR_DIVIDER_INNER: RGB = [240, 236, 227]; // #f0ece3 (inner grid line)

// Typography Colors
const COLOR_TEXT_MAIN: RGB = [28, 25, 23]; // #1c1917 (warm charcoal espresso)
const COLOR_TEXT_MUTED: RGB = [120, 113, 108]; // #78716c (warm stone gray)
const COLOR_TEXT_LIGHT: RGB = [168, 162, 158]; // #a8a29e (light stone)

// Status & Pill Colors
const SAGE_PILL_BG: RGB = [240, 253, 244]; // #f0fdf4
const SAGE_PILL_BORDER: RGB = [187, 247, 208]; // #bbf7d0
const SAGE_PILL_TEXT: RGB = [20, 83, 45]; // #14532d

const BEIGE_PILL_BG: RGB = [245, 240, 230]; // #f5f0e6
const BEIGE_PILL_BORDER: RGB = [230, 223, 211]; // #e6dfd3
const BEIGE_PILL_TEXT: RGB = [87, 83, 78]; // #57534e

const STATUS_AMBER_BG: RGB = [254, 243, 199];
const STATUS_AMBER_BORDER: RGB = [253, 230, 138];
const STATUS_AMBER_TEXT: RGB = [180, 83, 9];

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

export function downloadBatchAllocationPdf(params: {
  productionTarget: ProductionTargetRow;
  mrpRecord: MrpRow | null;
  groups: BatchAllocationPdfGroup[];
  finishedGoods: FinishedGoodTargetRow[];
}): void {
  const { productionTarget, mrpRecord, groups, finishedGoods } = params;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 36;
  const contentWidth = pageWidth - marginX * 2;
  let cursorY = 0;

  // ── 1. Elegant Header Band in Warm Beige with Forest Green Accents ──
  const headerHeight = 76;

  // Top Forest Green + Olive Dual Accent Bar (4pt)
  doc.setFillColor(...COLOR_BRAND_GREEN);
  doc.rect(0, 0, pageWidth * 0.7, 4, "F");
  doc.setFillColor(...COLOR_BRAND_OLIVE);
  doc.rect(pageWidth * 0.7, 0, pageWidth * 0.3, 4, "F");

  // Header Background: Warm Ivory Linen
  doc.setFillColor(...COLOR_BEIGE_HEADER);
  doc.rect(0, 4, pageWidth, headerHeight, "F");

  // Header Bottom Hairline Border
  doc.setDrawColor(...COLOR_BORDER);
  doc.setLineWidth(0.75);
  doc.line(0, headerHeight + 4, pageWidth, headerHeight + 4);

  // Divina Logo (Square Image)
  const logoSize = 52;
  try {
    doc.addImage(DIVINA_LOGO_BASE64, "JPEG", marginX, 14, logoSize, logoSize);
  } catch {
    // Graceful fallback if image rendering fails
    doc.setFillColor(...COLOR_BRAND_GREEN);
    doc.roundedRect(marginX, 14, logoSize, logoSize, 6, 6, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("D", marginX + logoSize / 2, 45, { align: "center" });
  }

  // Brand Name & Subtitle
  const brandX = marginX + logoSize + 12;

  doc.setTextColor(...COLOR_BRAND_GREEN);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("DIVINA FOODS", brandX, 33);

  // Subtitle Tag Badge in Soft Sage
  const badgeY = 43;
  const badgeWidth = 175;
  const badgeHeight = 17;
  doc.setFillColor(...SAGE_PILL_BG);
  doc.setDrawColor(...SAGE_PILL_BORDER);
  doc.setLineWidth(0.6);
  doc.roundedRect(brandX, badgeY, badgeWidth, badgeHeight, 3.5, 3.5, "FD");
  doc.setTextColor(...SAGE_PILL_TEXT);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("BATCH ALLOCATION REPORT", brandX + 8, badgeY + 11.5);

  // Right Side: Target ID Pill & Generated Timestamp
  const generatedOn = new Date().toLocaleString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const targetIdStr = productionTarget.productionTargetId || "REPORT";
  const idBadgeWidth = Math.max(88, doc.getTextWidth(targetIdStr) + 24);
  const idBadgeX = pageWidth - marginX - idBadgeWidth;

  // Target ID Pill (Forest Green)
  doc.setFillColor(...COLOR_BRAND_GREEN);
  doc.roundedRect(idBadgeX, 20, idBadgeWidth, 23, 5, 5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(targetIdStr, idBadgeX + idBadgeWidth / 2, 35, { align: "center" });

  // Timestamp
  doc.setTextColor(...COLOR_TEXT_MUTED);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Generated: ${generatedOn}`, pageWidth - marginX, 58, { align: "right" });

  cursorY = headerHeight + 20;

  // ── 2. Summary / Metadata Dashboard Panel (Warm Cream & Forest Green) ──
  const cardHeight = 84;
  doc.setFillColor(...COLOR_PANEL_BG);
  doc.setDrawColor(...COLOR_BORDER);
  doc.setLineWidth(0.75);
  doc.roundedRect(marginX, cursorY, contentWidth, cardHeight, 8, 8, "FD");

  // Subtle horizontal row divider
  doc.setDrawColor(...COLOR_DIVIDER_INNER);
  doc.line(marginX + 8, cursorY + 42, marginX + contentWidth - 8, cursorY + 42);

  // Subtle vertical column dividers
  const colWidth = contentWidth / 4;
  for (let c = 1; c < 4; c++) {
    const vx = marginX + c * colWidth;
    doc.line(vx, cursorY + 8, vx, cursorY + cardHeight - 8);
  }

  const totalBatches = groups.reduce((sum, g) => sum + g.lines.length, 0);
  const fields: Array<{ label: string; value: string; isStatus?: boolean; isHighlight?: boolean }> = [
    { label: "PRODUCTION TARGET", value: productionTarget.productionTargetId || "—" },
    { label: "STATUS", value: productionTarget.status || "—", isStatus: true },
    { label: "MRP ID", value: mrpRecord?.mrpId || "—" },
    { label: "ASSIGNED TO", value: productionTarget.assignedTo || "Unassigned" },
    { label: "START DATE", value: formatDateForPdf(productionTarget.startDate) },
    { label: "END DATE", value: formatDateForPdf(productionTarget.endDate) },
    { label: "RAW MATERIALS", value: String(groups.length), isHighlight: true },
    { label: "BATCHES ALLOCATED", value: String(totalBatches), isHighlight: true },
  ];

  fields.forEach((item, idx) => {
    const col = idx % 4;
    const row = Math.floor(idx / 4);
    const x = marginX + 14 + col * colWidth;
    const y = cursorY + 16 + row * 40;

    // Category Label
    doc.setTextColor(...COLOR_TEXT_MUTED);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text(item.label, x, y);

    // Value
    if (item.isStatus) {
      // Dynamic Status Badge in Sage Green or Amber
      const statusText = item.value;
      const isWaiting = statusText.toLowerCase().includes("waiting");
      const pillBg: RGB = isWaiting ? STATUS_AMBER_BG : SAGE_PILL_BG;
      const pillBorder: RGB = isWaiting ? STATUS_AMBER_BORDER : SAGE_PILL_BORDER;
      const pillText: RGB = isWaiting ? STATUS_AMBER_TEXT : SAGE_PILL_TEXT;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      const textWidth = doc.getTextWidth(statusText);
      const pillW = textWidth + 14;
      const pillH = 16;
      const pillY = y + 5;

      doc.setFillColor(...pillBg);
      doc.setDrawColor(...pillBorder);
      doc.setLineWidth(0.6);
      doc.roundedRect(x, pillY, pillW, pillH, 3.5, 3.5, "FD");

      doc.setTextColor(...pillText);
      doc.text(statusText, x + 7, pillY + 11.5);
    } else {
      doc.setTextColor(...(item.isHighlight ? COLOR_BRAND_GREEN : COLOR_TEXT_MAIN));
      doc.setFont("helvetica", "bold");
      doc.setFontSize(item.isHighlight ? 11 : 10);
      doc.text(item.value, x, y + 17);
    }
  });

  cursorY += cardHeight + 24;

  // ── 3. Finished Goods Table ──
  if (finishedGoods.length > 0) {
    if (cursorY > pageHeight - 160) {
      doc.addPage();
      cursorY = 46;
    }

    doc.setTextColor(...COLOR_TEXT_MAIN);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Finished Goods", marginX, cursorY + 6);
    cursorY += 16;

    autoTable(doc, {
      startY: cursorY,
      margin: { left: marginX, right: marginX },
      head: [["Item", "UOM", "Target Quantity"]],
      body: finishedGoods.map((fg) => [fg.itemName, fg.uomName, formatQty(fg.targetQuantity)]),
      theme: "grid",
      styles: {
        fontSize: 8.5,
        cellPadding: { top: 6, bottom: 6, left: 8, right: 8 },
        textColor: COLOR_TEXT_MAIN,
        lineColor: COLOR_BORDER,
        lineWidth: 0.5,
      },
      headStyles: {
        fillColor: COLOR_SLATE_GREEN,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8.5,
        lineColor: COLOR_SLATE_GREEN,
        lineWidth: 0.5,
      },
      alternateRowStyles: {
        fillColor: COLOR_ROW_ALT,
      },
      columnStyles: {
        0: { fontStyle: "bold", textColor: COLOR_SLATE_GREEN },
        1: { textColor: COLOR_TEXT_MUTED },
        2: { halign: "right", fontStyle: "bold", textColor: COLOR_BRAND_GREEN },
      },
    });

    cursorY = (doc as any).lastAutoTable.finalY + 24;
  }

  // ── 4. Per-Material Batch Allocation Tables ──
  groups.forEach((group, groupIndex) => {
    const materialName = group.material?.productName || group.fallbackName || "Unknown Material";
    const uom = group.material?.uom || "";
    const stockRequired = group.material ? group.material.stockRequired : undefined;
    const totalAllocated = group.lines.reduce((sum, l) => sum + (l.batchQty || 0), 0);

    // Page Break Check
    if (cursorY > pageHeight - 160) {
      doc.addPage();
      cursorY = 46;
    }

    // Number Badge in Forest Green
    const badgeSize = 18;
    doc.setFillColor(...COLOR_BRAND_GREEN);
    doc.roundedRect(marginX, cursorY, badgeSize, badgeSize, 4, 4, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(String(groupIndex + 1), marginX + badgeSize / 2, cursorY + 12.5, { align: "center" });

    // Material Title
    doc.setTextColor(...COLOR_TEXT_MAIN);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(materialName, marginX + badgeSize + 8, cursorY + 13);

    // Metadata Sub-Pills in Beige / Sage
    const metaY = cursorY + 23;
    let metaX = marginX;

    function drawMetaPill(label: string, value: string, isAccent = false) {
      const fullText = `${label}: ${value}`;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      const strW = doc.getTextWidth(fullText) + 12;

      const bg: RGB = isAccent ? SAGE_PILL_BG : BEIGE_PILL_BG;
      const border: RGB = isAccent ? SAGE_PILL_BORDER : BEIGE_PILL_BORDER;
      const textCol: RGB = isAccent ? SAGE_PILL_TEXT : BEIGE_PILL_TEXT;

      doc.setFillColor(...bg);
      doc.setDrawColor(...border);
      doc.setLineWidth(0.5);
      doc.roundedRect(metaX, metaY, strW, 14, 3, 3, "FD");

      doc.setTextColor(...textCol);
      doc.text(fullText, metaX + 6, metaY + 10);
      metaX += strW + 6;
    }

    if (uom) {
      drawMetaPill("UOM", uom);
    }
    if (stockRequired != null) {
      drawMetaPill("Stock Required", formatQty(stockRequired));
    }
    drawMetaPill("Total Allocated", formatQty(totalAllocated), true);

    cursorY = metaY + 20;

    const body = group.lines.map((line) => [
      line.batchNumber || (line.batchId ? `#${line.batchId.slice(-6)}` : "—"),
      formatDateForPdf(line.expiryDate),
      formatQty(line.batchQty),
      formatQty(line.remainingQty),
    ]);

    autoTable(doc, {
      startY: cursorY,
      margin: { left: marginX, right: marginX },
      head: [["Batch Number", "Expiry Date", "Allocated Qty", "Remaining Qty"]],
      body,
      theme: "grid",
      styles: {
        fontSize: 8.5,
        cellPadding: { top: 6, bottom: 6, left: 8, right: 8 },
        textColor: COLOR_TEXT_MAIN,
        lineColor: COLOR_BORDER,
        lineWidth: 0.5,
      },
      headStyles: {
        fillColor: COLOR_SLATE_GREEN,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8.5,
        lineColor: COLOR_SLATE_GREEN,
        lineWidth: 0.5,
      },
      alternateRowStyles: {
        fillColor: COLOR_ROW_ALT,
      },
      columnStyles: {
        0: { fontStyle: "bold", textColor: COLOR_SLATE_GREEN },
        1: { textColor: COLOR_TEXT_MUTED },
        2: { halign: "right", fontStyle: "bold", textColor: COLOR_BRAND_GREEN },
        3: { halign: "right", textColor: COLOR_TEXT_MUTED },
      },
    });

    cursorY = (doc as any).lastAutoTable.finalY + 24;
  });

  // ── 5. Warm Artisan Footer on Every Page ──
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Divider Line in Warm Stone
    doc.setDrawColor(...COLOR_BORDER);
    doc.setLineWidth(0.5);
    doc.line(marginX, pageHeight - 32, pageWidth - marginX, pageHeight - 32);

    // Left Footer Branding
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...COLOR_TEXT_LIGHT);
    doc.text("DIVINA FOODS  •  ARTISAN PIZZA BASES  •  BATCH ALLOCATION REPORT", marginX, pageHeight - 18);

    // Right Footer Pagination
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...COLOR_BRAND_GREEN);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - marginX, pageHeight - 18, { align: "right" });
  }

  const safeId = (productionTarget.productionTargetId || "Report").replace(/[^\w-]+/g, "_");
  doc.save(`Batch_Allocation_${safeId}.pdf`);
}

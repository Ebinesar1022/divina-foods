import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { BatchAllocationLine, MrpRow, ProductionTargetRow, RawMaterialNeedRow } from "../types";

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

// ───────────── Color Palette ─────────────
const COLOR_PRIMARY: RGB = [37, 99, 235]; // #2563eb
const COLOR_ACCENT: RGB = [14, 165, 233]; // #0ea5e9
const COLOR_DARK: RGB = [15, 23, 42]; // #0f172a
const COLOR_SLATE: RGB = [30, 41, 59]; // #1e293b
const COLOR_TEXT_MAIN: RGB = [15, 23, 42]; // #0f172a
const COLOR_TEXT_MUTED: RGB = [100, 116, 139]; // #64748b
const COLOR_TEXT_LIGHT: RGB = [148, 163, 184]; // #94a3b8
const COLOR_BORDER: RGB = [226, 232, 240]; // #e2e8f0
const COLOR_PANEL_BG: RGB = [248, 250, 252]; // #f8fafc
const COLOR_ROW_ALT: RGB = [250, 252, 255]; // #fafcff

// Status Colors
const STATUS_GREEN_BG: RGB = [236, 253, 245];
const STATUS_GREEN_BORDER: RGB = [167, 243, 208];
const STATUS_GREEN_TEXT: RGB = [5, 150, 105];

const STATUS_AMBER_BG: RGB = [254, 243, 199];
const STATUS_AMBER_BORDER: RGB = [253, 230, 138];
const STATUS_AMBER_TEXT: RGB = [180, 83, 9];

const STATUS_BLUE_BG: RGB = [239, 246, 255];
const STATUS_BLUE_BORDER: RGB = [191, 219, 254];
const STATUS_BLUE_TEXT: RGB = [29, 78, 216];

// Pill Colors
const PILL_DEFAULT_BG: RGB = [241, 245, 249];
const PILL_DEFAULT_BORDER: RGB = [226, 232, 240];
const PILL_ACCENT_BG: RGB = [239, 246, 255];
const PILL_ACCENT_BORDER: RGB = [191, 219, 254];
const PILL_ACCENT_TEXT: RGB = [29, 78, 216];

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
}): void {
  const { productionTarget, mrpRecord, groups } = params;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 36;
  const contentWidth = pageWidth - marginX * 2;
  let cursorY = 0;

  // ── 1. Modern Top Header Band ──
  const headerHeight = 76;

  // Dual-tone top accent line (4pt)
  doc.setFillColor(...COLOR_PRIMARY);
  doc.rect(0, 0, pageWidth * 0.65, 4, "F");
  doc.setFillColor(...COLOR_ACCENT);
  doc.rect(pageWidth * 0.65, 0, pageWidth * 0.35, 4, "F");

  // Main dark navy header background
  doc.setFillColor(...COLOR_DARK);
  doc.rect(0, 4, pageWidth, headerHeight, "F");

  // Brand Name
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text("DIVINA FOODS", marginX, 32);

  // Subtitle Tag Badge
  const badgeY = 42;
  const badgeWidth = 168;
  const badgeHeight = 18;
  doc.setFillColor(...COLOR_SLATE);
  doc.roundedRect(marginX, badgeY, badgeWidth, badgeHeight, 4, 4, "F");
  doc.setTextColor(147, 197, 253); // soft blue
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("BATCH ALLOCATION REPORT", marginX + 8, badgeY + 12);

  // Right Side: Target ID Badge & Timestamp
  const generatedOn = new Date().toLocaleString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const targetIdStr = productionTarget.productionTargetId || "REPORT";
  const idBadgeWidth = Math.max(90, doc.getTextWidth(targetIdStr) + 24);
  const idBadgeX = pageWidth - marginX - idBadgeWidth;

  // Target ID Pill
  doc.setFillColor(...COLOR_PRIMARY);
  doc.roundedRect(idBadgeX, 20, idBadgeWidth, 24, 6, 6, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11.5);
  doc.text(targetIdStr, idBadgeX + idBadgeWidth / 2, 36, { align: "center" });

  // Timestamp
  doc.setTextColor(...COLOR_TEXT_LIGHT);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Generated: ${generatedOn}`, pageWidth - marginX, 58, { align: "right" });

  cursorY = headerHeight + 20;

  // ── 2. Executive Metadata / KPI Panel ──
  const cardHeight = 84;
  doc.setFillColor(...COLOR_PANEL_BG);
  doc.setDrawColor(...COLOR_BORDER);
  doc.setLineWidth(0.75);
  doc.roundedRect(marginX, cursorY, contentWidth, cardHeight, 8, 8, "FD");

  // Subtle horizontal row divider inside panel
  doc.setDrawColor(238, 242, 246);
  doc.line(marginX + 8, cursorY + 42, marginX + contentWidth - 8, cursorY + 42);

  const colWidth = contentWidth / 4;
  // Subtle vertical column dividers inside panel
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

    // Label
    doc.setTextColor(...COLOR_TEXT_MUTED);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text(item.label, x, y);

    // Value
    if (item.isStatus) {
      // Draw status pill badge
      const statusText = item.value;
      const isCompleted = statusText.toLowerCase().includes("completed");
      const isWaiting = statusText.toLowerCase().includes("waiting");
      const pillBg: RGB = isCompleted
        ? STATUS_GREEN_BG
        : isWaiting
        ? STATUS_AMBER_BG
        : STATUS_BLUE_BG;
      const pillBorder: RGB = isCompleted
        ? STATUS_GREEN_BORDER
        : isWaiting
        ? STATUS_AMBER_BORDER
        : STATUS_BLUE_BORDER;
      const pillText: RGB = isCompleted
        ? STATUS_GREEN_TEXT
        : isWaiting
        ? STATUS_AMBER_TEXT
        : STATUS_BLUE_TEXT;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      const textWidth = doc.getTextWidth(statusText);
      const pillW = textWidth + 14;
      const pillH = 16;
      const pillY = y + 5;

      doc.setFillColor(...pillBg);
      doc.setDrawColor(...pillBorder);
      doc.setLineWidth(0.6);
      doc.roundedRect(x, pillY, pillW, pillH, 4, 4, "FD");

      doc.setTextColor(...pillText);
      doc.text(statusText, x + 7, pillY + 11.5);
    } else {
      doc.setTextColor(...(item.isHighlight ? COLOR_PRIMARY : COLOR_TEXT_MAIN));
      doc.setFont("helvetica", "bold");
      doc.setFontSize(item.isHighlight ? 11 : 10);
      doc.text(item.value, x, y + 17);
    }
  });

  cursorY += cardHeight + 24;

  // ── 3. Per-Material Batch Allocation Tables ──
  groups.forEach((group, groupIndex) => {
    const materialName = group.material?.productName || group.fallbackName || "Unknown Material";
    const uom = group.material?.uom || "";
    const stockRequired = group.material ? group.material.stockRequired : undefined;
    const totalAllocated = group.lines.reduce((sum, l) => sum + (l.batchQty || 0), 0);

    // Check if section header + table will fit, else add clean page break
    if (cursorY > pageHeight - 160) {
      doc.addPage();
      cursorY = 46;
    }

    // Number Badge
    const badgeSize = 18;
    doc.setFillColor(...COLOR_PRIMARY);
    doc.roundedRect(marginX, cursorY, badgeSize, badgeSize, 4, 4, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(String(groupIndex + 1), marginX + badgeSize / 2, cursorY + 12.5, { align: "center" });

    // Material Name
    doc.setTextColor(...COLOR_TEXT_MAIN);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(materialName, marginX + badgeSize + 8, cursorY + 13);

    // Metadata Sub-Pills
    const metaY = cursorY + 23;
    let metaX = marginX;

    // Pill helper
    function drawMetaPill(label: string, value: string, isAccent = false) {
      const fullText = `${label}: ${value}`;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      const strW = doc.getTextWidth(fullText) + 12;

      const bg: RGB = isAccent ? PILL_ACCENT_BG : PILL_DEFAULT_BG;
      const border: RGB = isAccent ? PILL_ACCENT_BORDER : PILL_DEFAULT_BORDER;
      const textCol: RGB = isAccent ? PILL_ACCENT_TEXT : COLOR_TEXT_MUTED;

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
        fillColor: COLOR_SLATE,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8.5,
        lineColor: COLOR_SLATE,
        lineWidth: 0.5,
      },
      alternateRowStyles: {
        fillColor: COLOR_ROW_ALT,
      },
      columnStyles: {
        0: { fontStyle: "bold", textColor: COLOR_SLATE },
        1: { textColor: COLOR_TEXT_MUTED },
        2: { halign: "right", fontStyle: "bold", textColor: COLOR_PRIMARY },
        3: { halign: "right", textColor: COLOR_TEXT_MUTED },
      },
    });

    cursorY = (doc as any).lastAutoTable.finalY + 24;
  });

  // ── 4. Elegant Footer on Every Page ──
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Divider Line
    doc.setDrawColor(...COLOR_BORDER);
    doc.setLineWidth(0.5);
    doc.line(marginX, pageHeight - 32, pageWidth - marginX, pageHeight - 32);

    // Left Footer Branding
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...COLOR_TEXT_LIGHT);
    doc.text("DIVINA FOODS  •  PRODUCTION OVERVIEW & BATCH ALLOCATION", marginX, pageHeight - 18);

    // Right Footer Pagination
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...COLOR_TEXT_MUTED);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - marginX, pageHeight - 18, { align: "right" });
  }

  const safeId = (productionTarget.productionTargetId || "Report").replace(/[^\w-]+/g, "_");
  doc.save(`Batch_Allocation_${safeId}.pdf`);
}

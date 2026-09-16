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

const BRAND_BLUE: [number, number, number] = [37, 99, 235];
const INK: [number, number, number] = [15, 23, 42];
const MUTED: [number, number, number] = [100, 116, 139];
const BORDER: [number, number, number] = [226, 232, 240];
const PANEL: [number, number, number] = [248, 250, 252];

// Most dates reaching this file are already Zoho's own display strings
// (e.g. "18-Nov-2026"), not ISO — pass those through untouched and only
// reformat genuine ISO dates.
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
  const marginX = 40;
  let cursorY = 0;

  // ── Header band ──
  doc.setFillColor(...BRAND_BLUE);
  doc.rect(0, 0, pageWidth, 74, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  doc.text("DIVINA FOODS", marginX, 33);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Batch Allocation Report", marginX, 53);

  const generatedOn = new Date().toLocaleString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  doc.setFontSize(9);
  doc.text(`Generated ${generatedOn}`, pageWidth - marginX, 33, { align: "right" });
  if (productionTarget.productionTargetId) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(productionTarget.productionTargetId, pageWidth - marginX, 53, { align: "right" });
  }

  cursorY = 100;

  // ── Summary info card ──
  const cardHeight = 78;
  doc.setDrawColor(...BORDER);
  doc.setFillColor(...PANEL);
  doc.roundedRect(marginX, cursorY, pageWidth - marginX * 2, cardHeight, 6, 6, "FD");

  const colWidth = (pageWidth - marginX * 2) / 4;
  const totalBatches = groups.reduce((sum, g) => sum + g.lines.length, 0);
  const fields: Array<[string, string]> = [
    ["Production Target", productionTarget.productionTargetId || "—"],
    ["Status", productionTarget.status || "—"],
    ["MRP ID", mrpRecord?.mrpId || "—"],
    ["Assigned To", productionTarget.assignedTo || "Unassigned"],
    ["Start Date", formatDateForPdf(productionTarget.startDate)],
    ["End Date", formatDateForPdf(productionTarget.endDate)],
    ["Raw Materials", String(groups.length)],
    ["Batches Allocated", String(totalBatches)],
  ];

  fields.forEach(([label, value], idx) => {
    const col = idx % 4;
    const row = Math.floor(idx / 4);
    const x = marginX + 18 + col * colWidth;
    const y = cursorY + 26 + row * 36;
    doc.setTextColor(...MUTED);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(label.toUpperCase(), x, y);
    doc.setTextColor(...INK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(value, x, y + 15);
  });

  cursorY += cardHeight + 30;

  // ── Per-material batch tables ──
  groups.forEach((group, groupIndex) => {
    const materialName = group.material?.productName || group.fallbackName || "Unknown Material";
    const uom = group.material?.uom || "";
    const stockRequired = group.material ? group.material.stockRequired : undefined;
    const totalAllocated = group.lines.reduce((sum, l) => sum + (l.batchQty || 0), 0);

    if (cursorY > pageHeight - 140) {
      doc.addPage();
      cursorY = 44;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...INK);
    doc.text(`${groupIndex + 1}. ${materialName}`, marginX, cursorY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    const subtitleParts = [
      uom ? `UOM: ${uom}` : "",
      stockRequired != null ? `Stock Required: ${formatQty(stockRequired)}` : "",
      `Total Allocated: ${formatQty(totalAllocated)}`,
    ].filter(Boolean);
    doc.text(subtitleParts.join("   ·   "), marginX, cursorY + 15);

    cursorY += 24;

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
      styles: { fontSize: 9.5, cellPadding: 6, textColor: INK, lineColor: BORDER, lineWidth: 0.6 },
      headStyles: { fillColor: BRAND_BLUE, textColor: 255, fontStyle: "bold", fontSize: 9.5 },
      alternateRowStyles: { fillColor: PANEL },
      columnStyles: {
        2: { halign: "right" },
        3: { halign: "right" },
      },
    });

    // jspdf-autotable augments the doc instance with this at runtime.
    cursorY = (doc as any).lastAutoTable.finalY + 26;
  });

  // ── Footer on every page ──
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(...BORDER);
    doc.line(marginX, pageHeight - 36, pageWidth - marginX, pageHeight - 36);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED);
    doc.text("Divina Foods — Production Overview", marginX, pageHeight - 22);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - marginX, pageHeight - 22, { align: "right" });
  }

  const safeId = (productionTarget.productionTargetId || "Report").replace(/[^\w-]+/g, "_");
  doc.save(`Batch_Allocation_${safeId}.pdf`);
}

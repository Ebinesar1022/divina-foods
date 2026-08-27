export type StageKey =
  | "production_target"
  | "mrp"
  | "procurement"
  | "production_inprogress"
  | "consumption_entry";

export type StageState = "done" | "active" | "pending" | "skipped";

// Confirmed against the app's .ds export — Production_Targets.Status is the
// field that carries both stage progression AND whether procurement is
// needed. Material_Requirement_Planning has its own unrelated Status field
// (just "False"/"True", see MrpRow.status below) — there is no separate
// Stock_Status field on either form.
export type ProductionTargetStatus = "Planned" | "Released" | "Waiting for Stock" | "In Progress" | "Completed";

export interface ProductionTargetRow {
  id: string;
  productionTargetId: string; // e.g. "PT-105"
  date: string;
  assignedTo: string;
  assignedToId?: string;
  startDate: string;
  endDate: string;
  status: ProductionTargetStatus;
  notes: string;
}

export interface MrpRow {
  id: string;
  mrpId: string; // e.g. "MRP-077"
  productionTargetId: string;
  date: string;
  createdBy: string;
  notes: string;
  status: "False" | "True"; // MRP's own Status field — unrelated to stock
}

// ───────────── Procurement ─────────────

// A Non_Stock_Items row — a shortfall raw material still awaiting a
// Purchase Order, or already covered by one ("PO Created").
export interface NonStockItemRow {
  id: string;
  productId: string;
  productName: string;
  uomId: string;
  uomName: string;
  stockOnHand: number;
  stockRequired: number;
  allocateQuantity: number;
  neededQuantity: number;
  status: "Needs Purchase" | "PO Created";
}

export interface SupplierOption {
  id: string;
  name: string;
}

export interface PaymentTermOption {
  id: string;
  name: string;
}

export interface TaxOption {
  id: string;
  name: string;
  rate: number; // percentage, e.g. 5 for 5%
}

// One PO_Line_Items row.
export interface PoLineRow {
  id: string;
  productId: string;
  productName: string;
  uomName: string;
  orderQuantity: number;
  receivedQuantity: number;
  unitPrice: number;
  taxPercentage: number;
  taxAmount: number;
  lineTotal: number;
}

// A Purchase_Order plus its line items — the primary read shape the
// Procurement tab renders (list of POs, each with a "Receive" action once
// it still has pending quantity).
export interface PurchaseOrderDetail {
  id: string;
  poNumber: string;
  poDate: string;
  mrpRecordId: string;
  supplierId: string;
  supplierName: string;
  status: string; // "Not Received" | "Partially Received" | "Received"
  subTotal: number;
  taxAmount: number;
  grandTotal: number;
  lines: PoLineRow[];
}

// ───────────── Create Purchase Order draft ─────────────

export interface PoLineDraftRow {
  nonStockItemId: string;
  productId: string;
  productName: string;
  uomId: string;
  uomName: string;
  neededQuantity: number;
  orderQuantity: number;
  unitPrice: number;
  taxTypeId: string; // "" = no tax on this line
  taxPercentage: number; // auto-filled from the selected tax type, editable
}

export interface CreatePoDraft {
  poNumber: string;
  poDate: string; // "YYYY-MM-DD"
  mrpRecordId: string;
  supplierId: string;
  paymentTermsId: string;
  expectedDeliveryDate: string; // "YYYY-MM-DD"
  lines: PoLineDraftRow[];
  sequenceRowId: string;
  sequencePurchaseNo: number;
}

// ───────────── Receive Purchase Order draft ─────────────

export interface ReceiveLineDraftRow {
  poLineId: string;
  productId: string;
  productName: string;
  uomId: string;
  uomName: string;
  orderedQuantity: number;
  receivedQuantitySoFar: number;
  pendingQuantity: number;
  receivableQuantity: number;
}

export interface ReceivePoDraft {
  receiveNo: string;
  receiveDate: string; // "YYYY-MM-DD"
  purchaseOrderRecordId: string;
  supplierId: string;
  warehouseId: string;
  lines: ReceiveLineDraftRow[];
  sequenceRowId: string;
  sequenceReceiveNo: number;
}

export interface ProductionInProgressRow {
  id: string;
  productionTargetId: string;
  date: string;
  assignedBy: string;
  productionStatus: string;
}

// One Finished_Goods_Cunsumptions row — how much of a finished good was
// actually produced (vs targeted) for this run, plus batch/expiry tracking.
export interface ConsumptionFinishedGoodRow {
  id: string;
  itemId: string;
  itemName: string;
  uom: string;
  targetQuantity: number;
  producedQuantity: number;
  scrapQuantity: number;
  batchNo: string;
  expiryDate: string;
}

// One Consumption_Items row — how much of an allocated raw material was
// actually consumed during the run.
export interface ConsumptionRawMaterialRow {
  id: string;
  productId: string;
  productName: string;
  uom: string;
  allocatedQuantity: number;
  consumedQuantity: number;
  scrapQuantity: number;
}

export interface ConsumptionEntryRow {
  id: string;
  consumptionId: string; // e.g. "CNE-021"
  productionTargetId: string; // display id, e.g. "PT-142"
  date: string;
  remarks: string;
  finishedGoods: ConsumptionFinishedGoodRow[];
  rawMaterials: ConsumptionRawMaterialRow[];
}

// ───────────── Complete Production (Consumption Entry draft) ─────────────
// A pre-populated, not-yet-written draft for the "Complete Production"
// dialog — finished-good lines default from the Production Target's own
// Finished_Good subform, raw-material lines default from the MRP's
// allocated quantities, mirroring the native "Fetch Production Target"
// form-load workflow on Consumption_Entry.

export interface ConsumptionFinishedGoodDraftRow {
  itemId: string;
  itemName: string;
  uom: string;
  targetQuantity: number;
  producedQuantity: number;
  scrapQuantity: number;
  batchNo: string;
  expiryDate: string; // "YYYY-MM-DD"
}

export interface ConsumptionRawMaterialDraftRow {
  productId: string;
  productName: string;
  uom: string;
  allocatedQuantity: number;
  consumedQuantity: number;
  scrapQuantity: number;
}

export interface ConsumptionEntryDraft {
  productionTargetRecordId: string;
  productionTargetId: string;
  consumptionId: string; // e.g. "CNE-021"
  date: string; // "YYYY-MM-DD"
  remarks: string;
  finishedGoods: ConsumptionFinishedGoodDraftRow[];
  rawMaterials: ConsumptionRawMaterialDraftRow[];
  sequenceRowId: string;
  sequenceConsumptionNo: number;
}

// ───────────── Create MRP ─────────────

// A Finished_Goods line already attached to a Production Target (created
// before the MRP exists — its MRP_ID gets set once the MRP is created).
export interface FinishedGoodTargetRow {
  id: string; // Finished_Goods record ID
  productionTargetRecordId: string; // Production_Target_ID lookup's record ID
  itemId: string; // Item lookup's record ID (Product_Master)
  itemName: string;
  uomId: string; // UOM lookup's record ID (UOM_Master)
  uomName: string;
  targetQuantity: number;
}

// One BOM_Items row for a finished good's BOM (per 1 unit of finished good).
export interface BomItemRow {
  bomId: string; // BOM_Master record ID
  productId: string; // raw material's Product_Master record ID
  productName: string;
  quantityRequired: number;
  uomId: string;
  uomName: string;
}

// One Main_Warehouse_Stock_Details row for a raw material.
export interface RawMaterialStockRow {
  productId: string;
  availableStock: number;
}

// A raw material's aggregated requirement across all finished goods on the
// target, after comparing to on-hand stock — this is what gets written to
// Raw_Materials rows.
export interface RawMaterialNeedRow {
  productId: string;
  productName: string;
  uom: string;
  stockOnHand: number;
  stockRequired: number;
  allocateQuantity: number;
  neededQuantity: number;
  status: "Needs Purchase" | "Stock Available";
}

export interface CreateMrpResult {
  mrpRecordId: string;
  mrpId: string; // e.g. "MRP-045"
  rawMaterials: RawMaterialNeedRow[];
}

// A fully-computed but not-yet-written MRP — everything needed to render
// the preview dialog, plus what commitMrpDraft needs to actually write it.
export interface MrpDraft {
  mrpId: string; // e.g. "MRP-091"
  mrpDate: string; // formatted for display + write, e.g. "26-Aug-2026"
  productionTargetRecordId: string;
  productionTargetId: string; // display id, e.g. "PT-118"
  warehouseId: string;
  finishedGoods: FinishedGoodTargetRow[];
  rawMaterials: RawMaterialNeedRow[];
  hasShortfall: boolean;
  sequenceRowId: string;
  sequenceMrpNo: number;
}

export interface MrpDetailData {
  mrpRecord: MrpRow;
  finishedGoods: FinishedGoodTargetRow[];
  rawMaterials: RawMaterialNeedRow[];
  hasShortfall: boolean;
}

// ───────────── Start Production ─────────────

export interface EmployeeOption {
  id: string;
  name: string;
}

export interface StartProductionDetails {
  startDate: string; // "YYYY-MM-DD" from a native <input type="date">
  endDate?: string; // "YYYY-MM-DD", or "" if not set
  assignedToId?: string; // Employee record ID, or "" if not set
}


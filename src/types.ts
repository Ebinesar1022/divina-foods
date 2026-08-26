export type StageKey =
  | "production_target"
  | "mrp"
  | "procurement"
  | "production_inprogress"
  | "consumption_entry";

export type StageState = "done" | "active" | "pending" | "skipped";

export type ProcurementRecordType = "purchase_order" | "purchase_receive";

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

export interface ProcurementRow {
  id: string;
  type: ProcurementRecordType;
  recordNo: string; // "PO-xxx" or "PR-xxx"
  mrpId: string;
  productionTargetId: string;
  date: string;
  supplier: string;
  receivedBy: string;
  status: string;
}

export interface ProductionInProgressRow {
  id: string;
  productionTargetId: string;
  date: string;
  assignedBy: string;
  productionStatus: string;
}

export interface ConsumptionEntryRow {
  id: string;
  productionTargetId: string;
  date: string;
  createdBy: string;
  status: string;
  consumedQty: string;
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


export type StageKey =
  | "production_target"
  | "mrp"
  | "procurement"
  | "production_inprogress"
  | "consumption_entry";

export type StageState = "done" | "active" | "pending" | "skipped";

export type MrpStockStatus =
  | "Waiting for Stock"
  | "Ready For Production"
  | "Production Inprogress"
  | "Completed Production Target";

export type ProcurementRecordType = "purchase_order" | "purchase_receive";

// Confirmed real values for Production_Target_Report's Status dropdown.
export type ProductionTargetStatus = "Planned" | "Waiting for Stock" | "In Progress" | "Completed";

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
  stockStatus: MrpStockStatus;
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

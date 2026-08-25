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

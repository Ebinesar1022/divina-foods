import type { MrpStockStatus, ProductionTargetStatus, StageKey, StageState } from "../types";

export interface StageConfig {
  key: StageKey;
  label: string;
  tabKey: string;
  iconName: string; // MUI icon name
}

export const STAGES: StageConfig[] = [
  { key: "production_target", label: "Production Target", tabKey: "overview", iconName: "GpsFixed" },
  { key: "mrp", label: "Material Requirement & Planning", tabKey: "mrp", iconName: "AssignmentTurnedIn" },
  { key: "procurement", label: "Procurement", tabKey: "procurement", iconName: "LocalShipping" },
  { key: "production_inprogress", label: "Production In progress", tabKey: "in_progress", iconName: "Autorenew" },
  { key: "consumption_entry", label: "Consumption Entry", tabKey: "consumption_entry", iconName: "DoneAll" },
];

export const TOTAL_STAGES = STAGES.length;

// Production Target's Status field only has 4 values (Planned, Waiting for
// Stock, In Progress, Completed) but the pipeline shows 5 stages — there is
// no distinct signal in Status alone for "sitting at the MRP stage
// specifically". A record with an MRP entry that hasn't yet resolved to
// "Waiting for Stock" will currently still read as "production_target"
// stage. Known limitation — leave as-is unless asked to address it.
export const STATUS_TO_STAGE: Record<ProductionTargetStatus, StageKey> = {
  Planned: "production_target",
  "Waiting for Stock": "procurement",
  "In Progress": "production_inprogress",
  Completed: "consumption_entry",
};

export function stageKeyFromStatus(status: ProductionTargetStatus): StageKey {
  return STATUS_TO_STAGE[status] ?? "production_target";
}

export function stageIndex(key: StageKey): number {
  return STAGES.findIndex((s) => s.key === key);
}

export function isProcurementRequired(stockStatus: MrpStockStatus | null): boolean {
  return stockStatus === "Waiting for Stock";
}

export function computeProgress(currentIndex: number, procurementSkipped: boolean): number {
  const effectiveTotal = procurementSkipped ? TOTAL_STAGES - 1 : TOTAL_STAGES;
  const effectiveIndex =
    procurementSkipped && currentIndex > stageIndex("procurement") ? currentIndex - 1 : currentIndex;
  return Math.round(((effectiveIndex + 1) * 100) / effectiveTotal);
}

export function stepState(
  index: number,
  currentIndex: number,
  isFullyComplete: boolean,
  procurementSkipped: boolean
): StageState {
  const stage = STAGES[index];
  if (stage.key === "procurement" && procurementSkipped) return "skipped";
  if (isFullyComplete) return "done";
  if (index < currentIndex) return "done";
  if (index === currentIndex) return "active";
  return "pending";
}

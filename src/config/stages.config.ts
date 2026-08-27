import type { ProductionTargetStatus, StageKey, StageState } from "../types";

export interface StageConfig {
  key: StageKey;
  label: string;
  tabKey: string;
  iconName: string; // MUI icon name
}

export const STAGES: StageConfig[] = [
  { key: "production_target", label: "Production Target", tabKey: "overview", iconName: "TrackChanges" },
  { key: "mrp", label: "Material Requirement & Planning", tabKey: "mrp", iconName: "Schema" },
  { key: "procurement", label: "Procurement", tabKey: "procurement", iconName: "ShoppingCart" },
  { key: "production_inprogress", label: "Production In progress", tabKey: "in_progress", iconName: "PrecisionManufacturing" },
  { key: "consumption_entry", label: "Consumption Entry", tabKey: "consumption_entry", iconName: "ChecklistRtl" },
];

export const TOTAL_STAGES = STAGES.length;

// Production Target's own Status field carries both stage progression AND
// the procurement-required signal — confirmed against the app's .ds export,
// which lists exactly these 5 values. "Released" is set by createMrpForTarget
// once an MRP is created with no shortfall, which is what previously left no
// distinct signal for "sitting at the MRP stage specifically" (that gap is
// now closed by mapping Released to the mrp stage).
export const STATUS_TO_STAGE: Record<ProductionTargetStatus, StageKey> = {
  Planned: "production_target",
  Released: "mrp",
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

export function isProcurementRequired(status: ProductionTargetStatus | null): boolean {
  return status === "Waiting for Stock";
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

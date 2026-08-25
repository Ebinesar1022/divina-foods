import type { MrpStockStatus, StageKey, StageState } from "../types";

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

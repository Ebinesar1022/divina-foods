import * as React from "react";
import { Box, Paper, Typography } from "@mui/material";
import * as Icons from "@mui/icons-material";
import CheckIcon from "@mui/icons-material/Check";
import RemoveIcon from "@mui/icons-material/Remove";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { STAGES, stepState } from "../config/stages.config";
import type { ConsumptionEntryRow, MrpRow, ProcurementRow, ProductionTargetRow } from "../types";

// Purely presentational — every value here is already sitting in the
// Production Overview page's own state (record/mrpRecord/procurementRecords/
// consumptionEntries) and the same stepState()/STAGES config PipelineStepper
// already uses. No new fetching, no new business rules.

interface ActivityTimelineProps {
  currentIndex: number;
  isFullyComplete: boolean;
  procurementSkipped: boolean;
  record: ProductionTargetRow;
  mrpRecord: MrpRow | null;
  procurementRecords: ProcurementRow[];
  consumptionEntries: ConsumptionEntryRow[];
}

const STATE_LABEL: Record<string, string> = {
  done: "Completed",
  active: "In Progress",
  pending: "Upcoming",
  skipped: "Skipped",
};

const STATE_PILL_COLOR: Record<string, string> = {
  Completed: "#10B981",
  "In Progress": "#2563EB",
  Upcoming: "#94A3B8",
  Skipped: "#94A3B8",
};

const STATE_NODE_STYLE: Record<string, { bg: string; border: string; fg: string }> = {
  done: { bg: "#10b981", border: "#10b981", fg: "#ffffff" },
  active: { bg: "#2563eb", border: "#2563eb", fg: "#ffffff" },
  pending: { bg: "#ffffff", border: "#cbd5e1", fg: "#94a3b8" },
  skipped: { bg: "#f1f5f9", border: "#cbd5e1", fg: "#94a3b8" },
};

function StageIcon({ iconName, sx }: { iconName: string; sx?: object }) {
  const IconComponent = (Icons as unknown as Record<string, React.ElementType>)[iconName];
  if (!IconComponent) return null;
  return <IconComponent sx={sx} />;
}

function subtextFor(
  stageKey: string,
  state: string,
  record: ProductionTargetRow,
  mrpRecord: MrpRow | null,
  procurementRecords: ProcurementRow[],
  consumptionEntries: ConsumptionEntryRow[]
): string {
  if (state === "skipped") return "Skipped — Stock Available";
  if (state === "pending") return "Upcoming";

  switch (stageKey) {
    case "production_target":
      return [record.date, record.assignedTo].filter(Boolean).join(" · ") || "—";
    case "mrp":
      return mrpRecord ? [mrpRecord.date, mrpRecord.createdBy].filter(Boolean).join(" · ") || "—" : "—";
    case "procurement": {
      const latest = procurementRecords[0];
      return latest ? [latest.date, latest.supplier].filter(Boolean).join(" · ") : "In progress";
    }
    case "production_inprogress":
      return [record.startDate, record.assignedTo].filter(Boolean).join(" · ") || "—";
    case "consumption_entry": {
      const latest = consumptionEntries[0];
      return latest ? [latest.date, latest.consumptionId].filter(Boolean).join(" · ") : "—";
    }
    default:
      return "—";
  }
}

export default function ActivityTimeline({
  currentIndex,
  isFullyComplete,
  procurementSkipped,
  record,
  mrpRecord,
  procurementRecords,
  consumptionEntries,
}: ActivityTimelineProps) {
  return (
    <Paper elevation={0} sx={{ borderRadius: "16px", p: { xs: 2, md: 2.5 }, height: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2.5 }}>
        <AccessTimeIcon sx={{ color: "#2563eb", fontSize: 20 }} />
        <Typography sx={{ fontWeight: 700, fontSize: 15 }}>Activity Timeline</Typography>
      </Box>

      <Box>
        {STAGES.map((stage, index) => {
          const state = stepState(index, currentIndex, isFullyComplete, procurementSkipped);
          const nodeStyle = STATE_NODE_STYLE[state];
          const label = STATE_LABEL[state];
          const isLast = index === STAGES.length - 1;
          const subtext = subtextFor(stage.key, state, record, mrpRecord, procurementRecords, consumptionEntries);

          return (
            <Box key={stage.key} sx={{ display: "flex", gap: 1.5 }}>
              {/* Node + connector column */}
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: nodeStyle.bg,
                    border: `2px solid ${nodeStyle.border}`,
                    flexShrink: 0,
                  }}
                >
                  {state === "done" ? (
                    <CheckIcon sx={{ color: nodeStyle.fg, fontSize: 16 }} />
                  ) : state === "skipped" ? (
                    <RemoveIcon sx={{ color: nodeStyle.fg, fontSize: 14 }} />
                  ) : (
                    <StageIcon iconName={stage.iconName} sx={{ color: nodeStyle.fg, fontSize: 16 }} />
                  )}
                </Box>
                {!isLast && (
                  <Box
                    sx={{
                      width: 2,
                      flex: 1,
                      minHeight: 28,
                      bgcolor: state === "done" ? "#10b981" : "#e2e8f0",
                      my: 0.5,
                    }}
                  />
                )}
              </Box>

              {/* Content */}
              <Box sx={{ flex: 1, minWidth: 0, pb: isLast ? 0 : 2.5 }}>
                <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: 13.5,
                      color: state === "done" ? "#059669" : state === "active" ? "#2563eb" : "#0F172A",
                    }}
                  >
                    {stage.label}
                  </Typography>
                  <Box
                    sx={{
                      px: 1,
                      py: 0.25,
                      borderRadius: "999px",
                      fontSize: 10.5,
                      fontWeight: 700,
                      flexShrink: 0,
                      whiteSpace: "nowrap",
                      color: STATE_PILL_COLOR[label],
                      bgcolor: `${STATE_PILL_COLOR[label]}18`,
                    }}
                  >
                    {label}
                  </Box>
                </Box>
                <Typography
                  sx={{
                    fontSize: 12,
                    color: "#64748B",
                    mt: 0.25,
                    fontStyle: state === "skipped" || state === "pending" ? "italic" : "normal",
                  }}
                >
                  {subtext}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}

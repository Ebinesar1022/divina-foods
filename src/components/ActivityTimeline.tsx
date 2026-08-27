import * as React from "react";
import { Box, Paper, Typography } from "@mui/material";
import * as Icons from "@mui/icons-material";
import CheckIcon from "@mui/icons-material/Check";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { STAGES, stepState } from "../config/stages.config";
import type { ConsumptionEntryRow, MrpRow, ProductionTargetRow, PurchaseOrderDetail } from "../types";

interface ActivityTimelineProps {
  currentIndex: number;
  isFullyComplete: boolean;
  procurementSkipped: boolean;
  record: ProductionTargetRow;
  mrpRecord: MrpRow | null;
  procurementRecords: PurchaseOrderDetail[];
  consumptionEntries: ConsumptionEntryRow[];
}

const STATE_LABEL: Record<string, string> = {
  done: "Completed",
  active: "In Progress",
  pending: "Upcoming",
  skipped: "Skipped",
};

const STATE_PILL_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  Completed: { bg: "rgba(16,185,129,0.10)", color: "#059669", border: "rgba(16,185,129,0.25)" },
  "In Progress": { bg: "rgba(37,99,235,0.10)", color: "#2563EB", border: "rgba(37,99,235,0.20)" },
  Upcoming: { bg: "rgba(148,163,184,0.10)", color: "#64748B", border: "rgba(148,163,184,0.25)" },
  Skipped: { bg: "rgba(203,213,225,0.22)", color: "#64748B", border: "rgba(148,163,184,0.25)" },
};

const STATE_NODE_STYLE: Record<string, { bg: string; border: string; fg: string; shadow?: string }> = {
  done: { bg: "rgba(16,185,129,0.10)", border: "#10B981", fg: "#059669", shadow: "0 2px 8px rgba(16, 185, 129, 0.15)" },
  active: { bg: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)", border: "#2563eb", fg: "#ffffff", shadow: "0 4px 12px rgba(37, 99, 235, 0.25)" },
  pending: { bg: "rgba(255,255,255,0.6)", border: "#e2e8f0", fg: "#94a3b8", shadow: "none" },
  skipped: { bg: "rgba(203,213,225,0.16)", border: "#cbd5e1", fg: "#94a3b8", shadow: "none" },
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
  procurementRecords: PurchaseOrderDetail[],
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
      return latest ? [latest.poDate, latest.supplierName].filter(Boolean).join(" · ") : "In progress";
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
    <Paper
      elevation={0}
      sx={{
        borderRadius: "18px",
        p: { xs: 2, sm: 2.5 },
        height: "100%",
        boxShadow: "0 8px 30px rgba(37, 99, 235, 0.08)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 3 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: "11px",
            bgcolor: "rgba(37,99,235,0.10)",
            color: "#2563EB",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AccessTimeIcon sx={{ fontSize: 18 }} />
        </Box>
        <Typography sx={{ fontWeight: 700, fontSize: 15, color: "#172033" }}>
          Activity Timeline
        </Typography>
      </Box>

      <Box>
        {STAGES.map((stage, index) => {
          const state = stepState(index, currentIndex, isFullyComplete, procurementSkipped);
          const nodeStyle = STATE_NODE_STYLE[state];
          const label = STATE_LABEL[state];
          const pillStyle = STATE_PILL_STYLE[label] || STATE_PILL_STYLE.Upcoming;
          const isLast = index === STAGES.length - 1;
          const isDone = state === "done";
          const subtext = subtextFor(stage.key, state, record, mrpRecord, procurementRecords, consumptionEntries);

          return (
            <Box key={stage.key} sx={{ display: "flex", gap: 1.75 }}>
              {/* Node + connector column */}
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                {/* Main Node with Top-Right Completed Badge */}
                <Box sx={{ position: "relative", flexShrink: 0 }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: nodeStyle.bg,
                      border: `2px solid ${nodeStyle.border}`,
                      boxShadow: nodeStyle.shadow,
                    }}
                  >
                    <StageIcon
                      iconName={stage.iconName}
                      sx={{ color: nodeStyle.fg, fontSize: 18 }}
                    />
                  </Box>

                  {/* Top-Right Badge: Only shown if state === 'done' */}
                  {isDone && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: -3,
                        right: -3,
                        width: 15,
                        height: 15,
                        borderRadius: "50%",
                        bgcolor: "#10b981",
                        border: "1.5px solid #ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 1px 4px rgba(16, 185, 129, 0.4)",
                        zIndex: 2,
                      }}
                    >
                      <CheckIcon sx={{ color: "#ffffff", fontSize: 10, stroke: "#ffffff", strokeWidth: 0.5 }} />
                    </Box>
                  )}
                </Box>

                {!isLast && (
                  <Box
                    sx={
                      state === "skipped"
                        ? {
                            width: 0,
                            flex: 1,
                            minHeight: 32,
                            my: 0.75,
                            borderLeft: "2px dashed #cbd5e1",
                          }
                        : {
                            width: 2,
                            flex: 1,
                            minHeight: 32,
                            bgcolor: state === "done" ? "#10b981" : "#e2e8f0",
                            my: 0.75,
                            borderRadius: "999px",
                          }
                    }
                  />
                )}
              </Box>

              {/* Content */}
              <Box sx={{ flex: 1, minWidth: 0, pb: isLast ? 0 : 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: 13.5,
                      color: state === "done" ? "#059669" : state === "active" ? "#2563eb" : "#1e293b",
                    }}
                  >
                    {stage.label}
                  </Typography>
                  <Box
                    sx={{
                      px: 1.1,
                      py: 0.25,
                      borderRadius: "999px",
                      fontSize: 10.5,
                      fontWeight: 700,
                      flexShrink: 0,
                      whiteSpace: "nowrap",
                      color: pillStyle.color,
                      bgcolor: pillStyle.bg,
                      border: `1px solid ${pillStyle.border}`,
                    }}
                  >
                    {label}
                  </Box>
                </Box>
                <Typography
                  sx={{
                    fontSize: 12,
                    color: "#64748B",
                    mt: 0.5,
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


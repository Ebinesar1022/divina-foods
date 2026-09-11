import { memo } from "react";
import { Box, Paper, Typography } from "@mui/material";
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
  done: {
    bg: "linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(5,150,105,0.20) 100%)",
    border: "#10B981",
    fg: "#059669",
    shadow: "0 2px 10px rgba(16, 185, 129, 0.20)",
  },
  active: {
    bg: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)",
    border: "#2563eb",
    fg: "#ffffff",
    shadow: "0 0 0 4px rgba(37, 99, 235, 0.15), 0 4px 14px rgba(37, 99, 235, 0.35)",
  },
  pending: {
    bg: "rgba(255,255,255,0.75)",
    border: "#e2e8f0",
    fg: "#94a3b8",
    shadow: "none",
  },
  skipped: {
    bg: "rgba(241,245,249,0.75)",
    border: "#cbd5e1",
    fg: "#94a3b8",
    shadow: "none",
  },
};

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

function tagFor(
  stageKey: string,
  state: string,
  record: ProductionTargetRow,
  mrpRecord: MrpRow | null,
  procurementRecords: PurchaseOrderDetail[],
  consumptionEntries: ConsumptionEntryRow[]
): string | null {
  if (state === "pending") return null;
  if (state === "skipped") return "In Stock";

  switch (stageKey) {
    case "production_target":
      return record.productionTargetId || null;
    case "mrp":
      return mrpRecord?.mrpId || null;
    case "procurement": {
      const latest = procurementRecords[0];
      return latest?.poNumber || (procurementRecords.length ? `${procurementRecords.length} PO(s)` : null);
    }
    case "production_inprogress":
      return record.endDate ? `Due: ${record.endDate}` : null;
    case "consumption_entry": {
      const latest = consumptionEntries[0];
      return latest?.consumptionId || (consumptionEntries.length ? `${consumptionEntries.length} logged` : null);
    }
    default:
      return null;
  }
}

function ActivityTimeline({
  currentIndex,
  isFullyComplete,
  procurementSkipped,
  record,
  mrpRecord,
  procurementRecords,
  consumptionEntries,
}: ActivityTimelineProps) {
  const completedCount = isFullyComplete
    ? STAGES.length
    : STAGES.filter((_, idx) => stepState(idx, currentIndex, isFullyComplete, procurementSkipped) === "done").length;

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: "18px",
        p: { xs: 2, sm: 2.5, md: 3 },
        height: "100%",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 8px 30px rgba(37, 99, 235, 0.08)",
        border: "1px solid rgba(255,255,255,0.75)",
        backdropFilter: "blur(18px) saturate(130%)",
        WebkitBackdropFilter: "blur(18px) saturate(130%)",
        backgroundColor: "rgba(255,255,255,0.62)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pb: 2,
          mb: { xs: 2, sm: 2.5 },
          borderBottom: "1px solid rgba(148,163,184,0.14)",
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: "10px",
              bgcolor: "rgba(37,99,235,0.10)",
              color: "#2563EB",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 6px rgba(37, 99, 235, 0.12)",
            }}
          >
            <AccessTimeIcon sx={{ fontSize: 19 }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: 15, color: "#172033", lineHeight: 1.2 }}>
              Activity Timeline
            </Typography>
            <Typography sx={{ fontSize: 11, color: "#64748B", fontWeight: 500 }}>
              Live Production Lifecycle
            </Typography>
          </Box>
        </Box>

        {/* Progress pill */}
        <Box
          sx={{
            px: 1.2,
            py: 0.35,
            borderRadius: "999px",
            fontSize: 11,
            fontWeight: 700,
            bgcolor: isFullyComplete ? "rgba(16,185,129,0.10)" : "rgba(37,99,235,0.10)",
            color: isFullyComplete ? "#059669" : "#2563EB",
            border: `1px solid ${isFullyComplete ? "rgba(16,185,129,0.25)" : "rgba(37,99,235,0.20)"}`,
            display: "flex",
            alignItems: "center",
            gap: 0.5,
          }}
        >
          {isFullyComplete ? "All Complete" : `${completedCount} / ${STAGES.length} Done`}
        </Box>
      </Box>

      {/* Timeline stages - distributes vertically to fill the card */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          minHeight: 0,
        }}
      >
        {STAGES.map((stage, index) => {
          const state = stepState(index, currentIndex, isFullyComplete, procurementSkipped);
          const nodeStyle = STATE_NODE_STYLE[state];
          const label = STATE_LABEL[state];
          const pillStyle = STATE_PILL_STYLE[label] || STATE_PILL_STYLE.Upcoming;
          const isLast = index === STAGES.length - 1;
          const isDone = state === "done";
          const isActive = state === "active";
          const isSkipped = state === "skipped";
          const subtext = subtextFor(stage.key, state, record, mrpRecord, procurementRecords, consumptionEntries);
          const tag = tagFor(stage.key, state, record, mrpRecord, procurementRecords, consumptionEntries);
          const StageIcon = stage.icon;

          return (
            <Box
              key={stage.key}
              sx={{
                display: "flex",
                gap: 1.75,
                flex: isLast ? "0 0 auto" : 1,
                minHeight: isLast ? "auto" : { xs: 58, sm: 66 },
                position: "relative",
              }}
            >
              {/* Node + Connector line column */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  flexShrink: 0,
                  pt: 0.25,
                }}
              >
                {/* Main Icon Node */}
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
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  >
                    <StageIcon sx={{ color: nodeStyle.fg, fontSize: 18 }} />
                  </Box>

                  {/* Completed Checkmark Badge */}
                  {isDone && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: -3,
                        right: -3,
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        bgcolor: "#10B981",
                        border: "2px solid #ffffff",
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

                {/* Dynamic Vertical Connector Line */}
                {!isLast && (
                  <Box
                    sx={{
                      flex: 1,
                      width: isSkipped ? 0 : 2.5,
                      minHeight: 22,
                      my: 0.75,
                      borderRadius: "999px",
                      ...(isSkipped
                        ? { borderLeft: "2px dashed #cbd5e1" }
                        : isDone
                        ? { bgcolor: "#10b981", boxShadow: "0 0 4px rgba(16, 185, 129, 0.25)" }
                        : { bgcolor: "#e2e8f0" }),
                      transition: "background-color 0.3s ease",
                    }}
                  />
                )}
              </Box>

              {/* Stage Content Card */}
              <Box
                sx={{
                  flex: 1,
                  minWidth: 0,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-start",
                  pb: isLast ? 0 : 1.75,
                }}
              >
                <Box
                  sx={{
                    p: { xs: 1.25, sm: 1.5 },
                    borderRadius: "12px",
                    border: "1px solid",
                    borderColor: isActive
                      ? "rgba(37, 99, 235, 0.25)"
                      : isDone
                      ? "rgba(16, 185, 129, 0.20)"
                      : "rgba(226, 232, 240, 0.65)",
                    bgcolor: isActive
                      ? "rgba(37, 99, 235, 0.04)"
                      : isDone
                      ? "rgba(240, 253, 244, 0.45)"
                      : "rgba(248, 250, 252, 0.50)",
                    backdropFilter: "blur(8px)",
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    "&:hover": {
                      bgcolor: isActive
                        ? "rgba(37, 99, 235, 0.08)"
                        : "rgba(255, 255, 255, 0.95)",
                      boxShadow: "0 4px 14px rgba(15, 23, 42, 0.05)",
                      borderColor: isActive
                        ? "rgba(37, 99, 235, 0.4)"
                        : "rgba(148, 163, 184, 0.4)",
                      transform: "translateX(2px)",
                    },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: { xs: 13, sm: 13.5 },
                        color: isDone ? "#059669" : isActive ? "#2563EB" : "#1e293b",
                        lineHeight: 1.3,
                      }}
                    >
                      {stage.label}
                    </Typography>
                    <Box
                      sx={{
                        px: 1,
                        py: 0.2,
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

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: 0.5,
                      mt: 0.6,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: 11.5,
                        color: "#64748B",
                        fontWeight: 500,
                        fontStyle: isSkipped || state === "pending" ? "italic" : "normal",
                      }}
                    >
                      {subtext}
                    </Typography>

                    {tag && (
                      <Box
                        sx={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: "#475569",
                          bgcolor: "rgba(148, 163, 184, 0.12)",
                          px: 0.85,
                          py: 0.15,
                          borderRadius: "6px",
                        }}
                      >
                        {tag}
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}

export default memo(ActivityTimeline);



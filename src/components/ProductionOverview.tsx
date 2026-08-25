import { useEffect, useState } from "react";
import { Box, CircularProgress, Tab, Tabs, Typography, Paper, Alert } from "@mui/material";
import ProjectHeader from "./ProjectHeader";
import PipelineStepper from "./PipelineStepper";
import StatusChip from "./StatusChip";
import { fetchProductionOverview } from "../services/productionApi";
import { computeProgress, isProcurementRequired, stageIndex } from "../config/stages.config";
import type {
  ConsumptionEntryRow,
  MrpRow,
  ProcurementRow,
  ProductionInProgressRow,
  ProductionTargetRow,
} from "../types";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "mrp", label: "MRP" },
  { key: "procurement", label: "Procurement" },
  { key: "in_progress", label: "In-Progress" },
  { key: "consumption_entry", label: "Consumption Entry" },
];

interface OverviewData {
  record: ProductionTargetRow | null;
  mrpRecord: MrpRow | null;
  procurementRecords: ProcurementRow[];
  productionInProgress: ProductionInProgressRow[];
  consumptionEntries: ConsumptionEntryRow[];
}

export default function ProductionOverview({ productionTargetId }: { productionTargetId: string }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<OverviewData | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    setLoading(true);
    fetchProductionOverview(productionTargetId).then(function (result) {
      setData(result);
      setLoading(false);
    });
  }, [productionTargetId]);

  if (loading || !data || !data.record) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const { record, mrpRecord, procurementRecords, productionInProgress, consumptionEntries } = data;
  const procurementSkipped = !!mrpRecord && !isProcurementRequired(mrpRecord.stockStatus);
  const currentIndex = stageIndex(record.stageStatus);
  const isFullyComplete = record.stageStatus === "consumption_entry";
  const progressPercent = computeProgress(currentIndex, procurementSkipped);

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: { xs: 2, md: 3 } }}>
      <ProjectHeader record={record} progressPercent={progressPercent} onBack={() => window.history.back()} />

      <Paper elevation={0} sx={{ mt: 3, borderRadius: "16px", p: { xs: 1, md: 2 } }}>
        <PipelineStepper
          currentStageKey={record.stageStatus}
          currentIndex={currentIndex}
          isFullyComplete={isFullyComplete}
          procurementSkipped={procurementSkipped}
        />
      </Paper>

      <Paper elevation={0} sx={{ mt: 3, borderRadius: "16px" }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ px: 2, borderBottom: "1px solid #E2E8F0" }}
        >
          {TABS.map((t) => (
            <Tab key={t.key} value={t.key} label={t.label} />
          ))}
        </Tabs>

        <Box sx={{ p: { xs: 2, md: 3 } }}>
          {activeTab === "overview" && (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(4, 1fr)" }, gap: 2 }}>
              <InfoCard label="Production Target ID" value={record.productionTargetId} />
              <InfoCard label="Date" value={record.date} />
              <InfoCard label="Assigned By" value={record.assignedBy} />
              <InfoCard label="Current Status" valueNode={<StatusChip value={record.status} />} />
            </Box>
          )}

          {activeTab === "mrp" && (
            <Box>
              {mrpRecord ? (
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2 }}>
                  <InfoCard label="MRP ID" value={mrpRecord.mrpId} />
                  <InfoCard label="Created By" value={mrpRecord.createdBy} />
                  <InfoCard label="Stock Status" valueNode={<StatusChip value={mrpRecord.stockStatus} />} />
                </Box>
              ) : (
                <Typography color="text.secondary">No MRP record found yet.</Typography>
              )}
            </Box>
          )}

          {activeTab === "procurement" && (
            <Box>
              {procurementSkipped ? (
                <Alert severity="info" sx={{ borderRadius: "12px" }}>
                  No procurement needed — stock was available at MRP stage.
                </Alert>
              ) : procurementRecords.length ? (
                procurementRecords.map((p) => (
                  <Paper
                    key={p.id}
                    variant="outlined"
                    sx={{ p: 1.5, mb: 1, borderRadius: "12px", display: "flex", justifyContent: "space-between" }}
                  >
                    <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                      <Box
                        sx={{
                          px: 1,
                          py: 0.25,
                          borderRadius: "6px",
                          fontSize: 11,
                          fontWeight: 700,
                          bgcolor: p.type === "purchase_order" ? "#EEF2FF" : "#ECFDF5",
                          color: p.type === "purchase_order" ? "#4F46E5" : "#059669",
                        }}
                      >
                        {p.type === "purchase_order" ? "PO" : "PR"}
                      </Box>
                      <Typography sx={{ fontWeight: 600 }}>{p.recordNo}</Typography>
                      <Typography color="text.secondary" sx={{ fontSize: 13 }}>
                        {p.supplier}
                      </Typography>
                    </Box>
                    <StatusChip value={p.status} />
                  </Paper>
                ))
              ) : (
                <Typography color="text.secondary">No procurement records yet.</Typography>
              )}
            </Box>
          )}

          {activeTab === "in_progress" && (
            <Box>
              {productionInProgress.length ? (
                productionInProgress.map((row) => (
                  <Paper key={row.id} variant="outlined" sx={{ p: 1.5, mb: 1, borderRadius: "12px" }}>
                    <Typography sx={{ fontWeight: 600 }}>{row.date}</Typography>
                    <Typography color="text.secondary" sx={{ fontSize: 13 }}>
                      Assigned to {row.assignedBy}
                    </Typography>
                    <StatusChip value={row.productionStatus} />
                  </Paper>
                ))
              ) : (
                <Typography color="text.secondary">No production batches logged yet.</Typography>
              )}
            </Box>
          )}

          {activeTab === "consumption_entry" && (
            <Box>
              {consumptionEntries.length ? (
                consumptionEntries.map((row) => (
                  <Paper key={row.id} variant="outlined" sx={{ p: 1.5, mb: 1, borderRadius: "12px" }}>
                    <Typography sx={{ fontWeight: 600 }}>Qty consumed: {row.consumedQty}</Typography>
                    <StatusChip value={row.status} />
                  </Paper>
                ))
              ) : (
                <Typography color="text.secondary">No consumption entries yet.</Typography>
              )}
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
}

function InfoCard({ label, value, valueNode }: { label: string; value?: string; valueNode?: React.ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: "12px" }}>
      <Typography sx={{ fontSize: 12, color: "text.secondary", mb: 0.5 }}>{label}</Typography>
      {valueNode || <Typography sx={{ fontWeight: 600 }}>{value || "—"}</Typography>}
    </Paper>
  );
}

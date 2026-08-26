import { useEffect, useRef, useState } from "react";
import { Box, CircularProgress, Tab, Tabs, Typography, Paper, Alert, Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import ProjectHeader from "./ProjectHeader";
import PipelineStepper from "./PipelineStepper";
import StatusChip from "./StatusChip";
import CreateMrpDialog from "./CreateMrpDialog";
import MrpReportView from "./MrpReportView";
import { commitMrpDraft, fetchProductionOverview, prepareMrpDraft } from "../services/productionApi";
import { computeProgress, isProcurementRequired, stageIndex, stageKeyFromStatus } from "../config/stages.config";
import type {
  ConsumptionEntryRow,
  MrpDetailData,
  MrpDraft,
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
  mrpDetails?: MrpDetailData | null;
  procurementRecords: ProcurementRow[];
  productionInProgress: ProductionInProgressRow[];
  consumptionEntries: ConsumptionEntryRow[];
}

export default function ProductionOverview({ productionTargetId }: { productionTargetId: string }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<OverviewData | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Create MRP: a two-phase draft → commit dialog. Opening it kicks off
  // prepareMrpDraft (read-only — explodes BOMs, checks stock, generates the
  // MRP_ID) so the user can review everything before anything is written;
  // only clicking Create in the dialog calls commitMrpDraft.
  const [mrpDialogOpen, setMrpDialogOpen] = useState(false);
  const [mrpDraft, setMrpDraft] = useState<MrpDraft | null>(null);
  const [draftError, setDraftError] = useState("");
  const [commitError, setCommitError] = useState("");
  const [committing, setCommitting] = useState(false);
  const [notes, setNotes] = useState("");
  // Refs update synchronously (unlike state), so these close the gap
  // `disabled={...}` props can't cover on their own — e.g. a second click
  // landing before React re-renders.
  const preparingRef = useRef(false);
  const committingRef = useRef(false);

  useEffect(() => {
    setLoading(true);
    fetchProductionOverview(productionTargetId).then(function (result) {
      setData(result);
      setLoading(false);
    });
  }, [productionTargetId]);

  function handleOpenCreateMrp() {
    if (!data || !data.record) return;
    if (preparingRef.current) return;
    preparingRef.current = true;
    setMrpDialogOpen(true);
    setMrpDraft(null);
    setDraftError("");
    setCommitError("");
    setNotes("");
    prepareMrpDraft(data.record.id, productionTargetId)
      .then(function (draft) {
        setMrpDraft(draft);
      })
      .catch(function (err: any) {
        setDraftError((err && err.message) || "Failed to prepare MRP. Please try again.");
      })
      .finally(function () {
        preparingRef.current = false;
      });
  }

  function handleCancelDraft() {
    if (committingRef.current) return; // nothing was written yet — safe to just close, except mid-commit
    setMrpDialogOpen(false);
    setMrpDraft(null);
    setDraftError("");
    setCommitError("");
  }

  function handleConfirmCreate() {
    if (!mrpDraft) return;
    if (committingRef.current) return;
    committingRef.current = true;
    setCommitting(true);
    setCommitError("");
    const committedDraft = mrpDraft;
    const committedNotes = notes;
    commitMrpDraft(committedDraft, committedNotes)
      .then(function () {
        return fetchProductionOverview(productionTargetId).then(function (result) {
          // If Creator report indexing has slight latency for child tables,
          // ensure the freshly committed draft data is immediately available for the report view
          if (result) {
            if (!result.mrpDetails || !result.mrpDetails.rawMaterials.length) {
              result.mrpDetails = {
                mrpRecord: result.mrpRecord || {
                  id: "",
                  mrpId: committedDraft.mrpId,
                  productionTargetId: committedDraft.productionTargetId,
                  date: committedDraft.mrpDate,
                  createdBy: "",
                  notes: committedNotes,
                  status: "False",
                },
                finishedGoods: committedDraft.finishedGoods,
                rawMaterials: committedDraft.rawMaterials,
                hasShortfall: committedDraft.hasShortfall,
              };
            }
          }
          setData(result);
        });
      })
      .then(function () {
        setMrpDialogOpen(false);
        setMrpDraft(null);
      })
      .catch(function (err: any) {
        setCommitError((err && err.message) || "Failed to create MRP. Please try again.");
      })
      .finally(function () {
        committingRef.current = false;
        setCommitting(false);
      });
  }

  if (loading || !data || !data.record) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const { record, mrpRecord, procurementRecords, productionInProgress, consumptionEntries } = data;
  const procurementSkipped = !!mrpRecord && !isProcurementRequired(record.status);
  const stageKey = stageKeyFromStatus(record.status);
  const currentIndex = stageIndex(stageKey);
  const isFullyComplete = stageKey === "consumption_entry";
  const progressPercent = computeProgress(currentIndex, procurementSkipped);

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: { xs: 2, md: 3 } }}>
      <ProjectHeader record={record} progressPercent={progressPercent} onBack={() => window.history.back()} />

      <Paper elevation={0} sx={{ mt: 3, borderRadius: "16px", p: { xs: 1, md: 2 } }}>
        <PipelineStepper
          currentStageKey={stageKey}
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
              <InfoCard label="Assigned To" value={record.assignedTo} />
              <InfoCard label="Current Status" valueNode={<StatusChip value={record.status} />} />
            </Box>
          )}

          {activeTab === "mrp" && (
            <Box>
              {mrpRecord ? (
                <MrpReportView
                  mrpRecord={mrpRecord}
                  mrpDetails={data.mrpDetails}
                  productionTarget={record}
                />
              ) : (
                <Paper
                  variant="outlined"
                  sx={{
                    p: { xs: 3, md: 4 },
                    borderRadius: "14px",
                    textAlign: "center",
                    bgcolor: "#F8FAFC",
                    borderStyle: "dashed",
                    borderColor: "#CBD5E1",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: "12px",
                      bgcolor: "#EFF6FF",
                      color: "#2563eb",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <AssignmentTurnedInIcon sx={{ fontSize: 28 }} />
                  </Box>
                  <Box sx={{ maxWidth: 450 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: 16, color: "#0F172A", mb: 0.5 }}>
                      No Material Requirement &amp; Planning Yet
                    </Typography>
                    <Typography sx={{ fontSize: 13.5, color: "#64748B" }}>
                      Generate the MRP to explode BOMs, evaluate available warehouse stock, and compute needed purchase quantities.
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    size="medium"
                    startIcon={<AddIcon />}
                    onClick={handleOpenCreateMrp}
                    sx={{
                      borderRadius: "10px",
                      textTransform: "none",
                      fontWeight: 600,
                      px: 2.5,
                      py: 1,
                      boxShadow: "0 4px 12px rgba(37, 99, 235, 0.2)",
                    }}
                  >
                    Create MRP
                  </Button>
                </Paper>
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

      <CreateMrpDialog
        open={mrpDialogOpen}
        draft={mrpDraft}
        draftError={draftError}
        committing={committing}
        commitError={commitError}
        notes={notes}
        onNotesChange={setNotes}
        onCancel={handleCancelDraft}
        onConfirm={handleConfirmCreate}
      />
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

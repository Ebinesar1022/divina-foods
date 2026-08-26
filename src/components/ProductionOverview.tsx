import { useEffect, useRef, useState } from "react";
import {
  Box,
  Tab,
  Tabs,
  Typography,
  Paper,
  Alert,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import ProjectHeader from "./ProjectHeader";
import PipelineStepper from "./PipelineStepper";
import StatusChip from "./StatusChip";
import CreateMrpDialog from "./CreateMrpDialog";
import InitiateProductionDialog from "./InitiateProductionDialog";
import MrpReportView from "./MrpReportView";
import FoodProductionLoader from "./FoodProductionLoader";
import {
  commitMrpDraft,
  fetchEmployees,
  fetchProductionOverview,
  prepareMrpDraft,
  startProduction,
  allocateStockOnProductionStart,
} from "../services/productionApi";
import {
  computeProgress,
  isProcurementRequired,
  stageIndex,
  stageKeyFromStatus,
} from "../config/stages.config";
import type {
  ConsumptionEntryRow,
  EmployeeOption,
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
  { key: "initiate_production", label: "Initiate Production" },
  { key: "in_progress", label: "In-Progress" },
  { key: "consumption_entry", label: "Consumption Entry" },
];

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseZohoDateToIso(dateStr: string): string {
  if (!dateStr) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const parts = dateStr.split("-");
  if (parts.length === 3 && parts[1].length === 3) {
    const day = parts[0].padStart(2, "0");
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const monthIdx = monthNames.findIndex(
      (m) => m.toLowerCase() === parts[1].toLowerCase(),
    );
    if (monthIdx !== -1) {
      const month = String(monthIdx + 1).padStart(2, "0");
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  return "";
}

interface OverviewData {
  record: ProductionTargetRow | null;
  mrpRecord: MrpRow | null;
  mrpDetails?: MrpDetailData | null;
  procurementRecords: ProcurementRow[];
  productionInProgress: ProductionInProgressRow[];
  consumptionEntries: ConsumptionEntryRow[];
}

export default function ProductionOverview({
  productionTargetId,
}: {
  productionTargetId: string;
}) {
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

  // Start Production: dialog prefilled with MRP ID, Production Target, and Target details.
  const [poDialogOpen, setPoDialogOpen] = useState(false);
  const [poCommitError, setPoCommitError] = useState("");
  const [poCommitting, setPoCommitting] = useState(false);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const poCommittingRef = useRef(false);

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
        setDraftError(
          (err && err.message) || "Failed to prepare MRP. Please try again.",
        );
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
        return fetchProductionOverview(productionTargetId).then(
          function (result) {
            // If Creator report indexing has slight latency for child tables,
            // ensure the freshly committed draft data is immediately available for the report view
            const mrpDetails = result.mrpDetails;
            if (!mrpDetails || !mrpDetails.rawMaterials.length) {
              const overrideDetails = {
                mrpRecord: result.mrpRecord || {
                  id: "",
                  mrpId: committedDraft.mrpId,
                  productionTargetId: committedDraft.productionTargetId,
                  date: committedDraft.mrpDate,
                  createdBy: "",
                  notes: committedNotes,
                  status: "False" as const,
                },
                finishedGoods: committedDraft.finishedGoods,
                rawMaterials: committedDraft.rawMaterials,
                hasShortfall: committedDraft.hasShortfall,
              };
              setData({ ...result, mrpDetails: overrideDetails });
            } else {
              setData(result);
            }
          },
        );
      })
      .then(function () {
        setMrpDialogOpen(false);
        setMrpDraft(null);
      })
      .catch(function (err: any) {
        setCommitError(
          (err && err.message) || "Failed to create MRP. Please try again.",
        );
      })
      .finally(function () {
        committingRef.current = false;
        setCommitting(false);
      });
  }

  function handleOpenInitiateProduction() {
    if (!data || !data.record) return;
    const target = data.record;
    setPoDialogOpen(true);
    setPoCommitError("");
    setStartDate(parseZohoDateToIso(target.startDate) || todayIsoDate());
    setEndDate(parseZohoDateToIso(target.endDate));
    setAssignedToId(target.assignedToId || "");
    fetchEmployees().then(function (empList) {
      setEmployees(empList);
      if (!target.assignedToId && target.assignedTo) {
        const matched = empList.find(
          (e) => e.name.toLowerCase() === target.assignedTo.toLowerCase(),
        );
        if (matched) {
          setAssignedToId(matched.id);
        }
      }
    });
  }

  function handleCancelPoDraft() {
    if (poCommittingRef.current) return;
    setPoDialogOpen(false);
    setPoCommitError("");
  }

  function handleConfirmInitiateProduction() {
    if (!data || !data.record) return;
    if (poCommittingRef.current) return;
    poCommittingRef.current = true;
    setPoCommitting(true);
    setPoCommitError("");
    Promise.all([
      startProduction(data.record.id, { startDate, endDate, assignedToId }),
      allocateStockOnProductionStart(data.record.id),
    ])
      .then(function () {
        return fetchProductionOverview(productionTargetId).then(
          function (result) {
            setData(result);
          },
        );
      })
      .then(function () {
        setPoDialogOpen(false);
      })
      .catch(function (err: any) {
        setPoCommitError(
          (err && err.message) ||
            "Failed to start production. Please try again.",
        );
      })
      .finally(function () {
        poCommittingRef.current = false;
        setPoCommitting(false);
      });
  }

  if (loading || !data || !data.record) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <FoodProductionLoader
          size="large"
          text="Loading Production Overview…"
          subtext="Fetching recipe formulations, stock levels & stage progression"
        />
      </Box>
    );
  }

  const { record, mrpRecord, procurementRecords, productionInProgress, consumptionEntries } = data;
  const procurementSkipped = !!mrpRecord && !isProcurementRequired(record.status);
  const neededItems = (data.mrpDetails?.rawMaterials || []).filter((rm) => rm.status === "Needs Purchase");
  const stageKey = stageKeyFromStatus(record.status);
  const currentIndex = stageIndex(stageKey);
  const isFullyComplete = stageKey === "consumption_entry";
  const progressPercent = computeProgress(currentIndex, procurementSkipped);

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: { xs: 2, md: 3 } }}>
      <ProjectHeader
        record={record}
        progressPercent={progressPercent}
        onBack={() => window.history.back()}
      />

      <Paper
        elevation={0}
        sx={{ mt: 3, borderRadius: "16px", p: { xs: 1, md: 2 } }}
      >
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
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(4, 1fr)" },
                gap: 2,
              }}
            >
              <InfoCard
                label="Production Target ID"
                value={record.productionTargetId}
              />
              <InfoCard label="Date" value={record.date} />
              <InfoCard label="Assigned To" value={record.assignedTo} />
              <InfoCard
                label="Current Status"
                valueNode={<StatusChip value={record.status} />}
              />
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
                <CenteredStateCard
                  icon={<AssignmentTurnedInIcon sx={{ fontSize: 28 }} />}
                  title="No Material Requirement &amp; Planning Yet"
                  description="Generate the MRP to explode BOMs, evaluate available warehouse stock, and compute needed purchase quantities."
                  action={
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
                  }
                />
              )}
            </Box>
          )}

          {activeTab === "procurement" && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {!mrpRecord ? (
                <CenteredStateCard
                  icon={<AssignmentTurnedInIcon sx={{ fontSize: 28 }} />}
                  title="MRP Not Created Yet"
                  description="Create the Material Requirement &amp; Planning first to see what needs to be procured."
                />
              ) : record.status === "Waiting for Stock" ? (
                <>
                  <CenteredStateCard
                    icon={<ShoppingCartOutlinedIcon sx={{ fontSize: 28 }} />}
                    iconBg="#FEF3C7"
                    iconColor="#D97706"
                    title="Procurement Needed"
                    description="Raise purchase orders for the raw materials below. Once everything has arrived, head to Initiate Production to start the run."
                  />

                  <Box>
                    <Typography sx={{ fontWeight: 700, mb: 1 }}>Needed Items</Typography>
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: "12px" }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ "& th": { fontWeight: 700, bgcolor: "#F1F5F9" } }}>
                            <TableCell>Product Name</TableCell>
                            <TableCell>UOM</TableCell>
                            <TableCell align="right">Needed Quantity</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {neededItems.length ? (
                            neededItems.map((rm) => (
                              <TableRow key={rm.productId}>
                                <TableCell>{rm.productName}</TableCell>
                                <TableCell>{rm.uom}</TableCell>
                                <TableCell align="right">{rm.neededQuantity.toFixed(2)}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={3} align="center" sx={{ py: 3, color: "#94A3B8" }}>
                                No shortfall items found.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>

                  {procurementRecords.length > 0 && (
                    <Box>
                      <Typography sx={{ fontWeight: 700, mb: 1 }}>Purchase Orders &amp; Receives</Typography>
                      {procurementRecords.map((p) => (
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
                      ))}
                    </Box>
                  )}
                </>
              ) : record.status === "Completed" ? (
                <CenteredStateCard
                  icon={<EmojiEventsOutlinedIcon sx={{ fontSize: 28 }} />}
                  iconBg="#ECFDF5"
                  iconColor="#059669"
                  title="Production Completed!"
                  description="This target went all the way from MRP through procurement to a finished run. Nice work."
                />
              ) : (
                <CenteredStateCard
                  icon={<CheckCircleOutlineIcon sx={{ fontSize: 28 }} />}
                  iconBg="#ECFDF5"
                  iconColor="#059669"
                  title="Procurement Complete"
                  description="All raw materials are available. Head to the Initiate Production tab to start the run."
                />
              )}
            </Box>
          )}

          {activeTab === "initiate_production" && (
            <Box>
              {record.status === "In Progress" ||
              record.status === "Completed" ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <Box sx={{ position: "relative" }}>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                        gap: 2,
                      }}
                    >
                      <InfoCard label="MRP ID" value={mrpRecord?.mrpId} />
                      <InfoCard
                        label="Production Target ID"
                        value={record.productionTargetId}
                      />
                      <InfoCard label="Start Date" value={record.startDate} />
                      <InfoCard label="End Date" value={record.endDate} />
                      <InfoCard label="Assigned To" value={record.assignedTo} />
                      <InfoCard
                        label="Target Status"
                        valueNode={<StatusChip value={record.status} />}
                      />
                    </Box>
                    <StatusStamp
                      text={record.status === "Completed" ? "Production Completed" : "Production Started"}
                      color={record.status === "Completed" ? "#059669" : "#2563eb"}
                    />
                  </Box>

                  {(data.mrpDetails?.finishedGoods?.length ?? 0) > 0 && (
                    <Box>
                      <Typography sx={{ fontWeight: 700, mb: 1 }}>Finished Goods</Typography>
                      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: "12px" }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ "& th": { fontWeight: 700, bgcolor: "#F1F5F9" } }}>
                              <TableCell>Item</TableCell>
                              <TableCell>UOM</TableCell>
                              <TableCell align="right">Target Quantity</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {data.mrpDetails!.finishedGoods.map((fg) => (
                              <TableRow key={fg.id}>
                                <TableCell>{fg.itemName}</TableCell>
                                <TableCell>{fg.uomName}</TableCell>
                                <TableCell align="right">{fg.targetQuantity}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  )}
                </Box>
              ) : !mrpRecord ? (
                <Alert severity="info" sx={{ borderRadius: "12px" }}>
                  Create the MRP first before initiating production.
                </Alert>
              ) : isProcurementRequired(record.status) ? (
                <Alert severity="warning" sx={{ borderRadius: "12px" }}>
                  Procurement must be completed before production can start.
                </Alert>
              ) : (
                <Box>
                  <Button
                    variant="contained"
                    startIcon={<PlayCircleIcon />}
                    onClick={handleOpenInitiateProduction}
                    sx={{ borderRadius: "10px", textTransform: "none" }}
                  >
                    Start Production
                  </Button>
                </Box>
              )}
            </Box>
          )}

          {activeTab === "in_progress" && (
            <Box>
              {productionInProgress.length ? (
                productionInProgress.map((row) => (
                  <Paper
                    key={row.id}
                    variant="outlined"
                    sx={{ p: 1.5, mb: 1, borderRadius: "12px" }}
                  >
                    <Typography sx={{ fontWeight: 600 }}>{row.date}</Typography>
                    <Typography color="text.secondary" sx={{ fontSize: 13 }}>
                      Assigned to {row.assignedBy}
                    </Typography>
                    <StatusChip value={row.productionStatus} />
                  </Paper>
                ))
              ) : (
                <Typography color="text.secondary">
                  No production batches logged yet.
                </Typography>
              )}
            </Box>
          )}

          {activeTab === "consumption_entry" && (
            <Box>
              {consumptionEntries.length ? (
                consumptionEntries.map((row) => (
                  <Paper
                    key={row.id}
                    variant="outlined"
                    sx={{ p: 1.5, mb: 1, borderRadius: "12px" }}
                  >
                    <Typography sx={{ fontWeight: 600 }}>
                      Qty consumed: {row.consumedQty}
                    </Typography>
                    <StatusChip value={row.status} />
                  </Paper>
                ))
              ) : (
                <Typography color="text.secondary">
                  No consumption entries yet.
                </Typography>
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

      <InitiateProductionDialog
        open={poDialogOpen}
        mrpId={mrpRecord?.mrpId || ""}
        productionTargetId={record.productionTargetId}
        employees={employees}
        committing={poCommitting}
        commitError={poCommitError}
        startDate={startDate}
        endDate={endDate}
        assignedToId={assignedToId}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onAssignedToChange={setAssignedToId}
        onCancel={handleCancelPoDraft}
        onConfirm={handleConfirmInitiateProduction}
      />
    </Box>
  );
}

function InfoCard({
  label,
  value,
  valueNode,
}: {
  label: string;
  value?: string;
  valueNode?: React.ReactNode;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: "12px" }}>
      <Typography sx={{ fontSize: 12, color: "text.secondary", mb: 0.5 }}>
        {label}
      </Typography>
      {valueNode || (
        <Typography sx={{ fontWeight: 600 }}>{value || "—"}</Typography>
      )}
    </Paper>
  );
}

// A centered, dashed-border status card — used across tabs for "nothing to
// show yet" / "here's what's next" states (no MRP yet, procurement needed,
// procurement complete, run finished, ...).
function CenteredStateCard({
  icon,
  title,
  description,
  iconBg = "#EFF6FF",
  iconColor = "#2563eb",
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  iconBg?: string;
  iconColor?: string;
  action?: React.ReactNode;
}) {
  return (
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
          bgcolor: iconBg,
          color: iconColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </Box>
      <Box sx={{ maxWidth: 480 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 16, color: "#0F172A", mb: 0.5 }}>{title}</Typography>
        {description && <Typography sx={{ fontSize: 13.5, color: "#64748B" }}>{description}</Typography>}
      </Box>
      {action}
    </Paper>
  );
}

// A classic rotated "ink stamp" overlay — sits on top of whatever's behind
// it (pointer-events disabled, no fill, so the content stays fully visible
// and clickable underneath). Wrap the target content in a
// `position: relative` Box and drop this inside it.
function StatusStamp({ text, color = "#2563eb" }: { text: string; color?: string }) {
  return (
    <Box
      aria-hidden
      sx={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        overflow: "hidden",
        zIndex: 1,
      }}
    >
      <Box
        sx={{
          position: "relative",
          transform: "rotate(-10deg)",
          border: `3px solid ${color}`,
          borderRadius: "10px",
          color: color,
          fontWeight: 800,
          fontSize: { xs: 18, sm: 24 },
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          px: { xs: 2, sm: 3 },
          py: { xs: 0.75, sm: 1 },
          opacity: 0.62,
          whiteSpace: "nowrap",
          userSelect: "none",
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 4,
            border: `1px solid ${color}`,
            borderRadius: "6px",
          },
        }}
      >
        {text}
      </Box>
    </Box>
  );
}

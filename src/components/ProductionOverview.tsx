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
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import ProjectHeader from "./ProjectHeader";
import PipelineStepper from "./PipelineStepper";
import ActivityTimeline from "./ActivityTimeline";
import StatusChip from "./StatusChip";
import CreateMrpDialog from "./CreateMrpDialog";
import InitiateProductionDialog from "./InitiateProductionDialog";
import ConsumptionEntryDialog from "./ConsumptionEntryDialog";
import MrpReportView from "./MrpReportView";
import FoodProductionLoader from "./FoodProductionLoader";
import {
  commitMrpDraft,
  commitConsumptionEntry,
  fetchEmployees,
  fetchProductionOverview,
  prepareConsumptionDraft,
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
  ConsumptionEntryDraft,
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

  // Complete Production: dialog prefilled from the Production Target's own
  // finished goods + the MRP's allocated raw materials (mirrors the native
  // "Complete Production" custom action, which opens this same form).
  const [consumptionDialogOpen, setConsumptionDialogOpen] = useState(false);
  const [consumptionDraft, setConsumptionDraft] = useState<ConsumptionEntryDraft | null>(null);
  const [consumptionDraftError, setConsumptionDraftError] = useState("");
  const [consumptionCommitError, setConsumptionCommitError] = useState("");
  const [consumptionCommitting, setConsumptionCommitting] = useState(false);
  const preparingConsumptionRef = useRef(false);
  const committingConsumptionRef = useRef(false);

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

  function handleOpenCompleteProduction() {
    if (!data || !data.record) return;
    if (preparingConsumptionRef.current) return;
    preparingConsumptionRef.current = true;
    setConsumptionDialogOpen(true);
    setConsumptionDraft(null);
    setConsumptionDraftError("");
    setConsumptionCommitError("");
    prepareConsumptionDraft(data.record.id, productionTargetId, data.mrpRecord?.id || "")
      .then(function (draft) {
        setConsumptionDraft(draft);
      })
      .catch(function (err: any) {
        setConsumptionDraftError(
          (err && err.message) || "Failed to prepare the consumption entry. Please try again.",
        );
      })
      .finally(function () {
        preparingConsumptionRef.current = false;
      });
  }

  function handleCancelConsumptionDraft() {
    if (committingConsumptionRef.current) return;
    setConsumptionDialogOpen(false);
    setConsumptionDraft(null);
    setConsumptionDraftError("");
    setConsumptionCommitError("");
  }

  function handleConfirmConsumptionEntry() {
    if (!consumptionDraft) return;
    if (committingConsumptionRef.current) return;
    committingConsumptionRef.current = true;
    setConsumptionCommitting(true);
    setConsumptionCommitError("");
    const committedDraft = consumptionDraft;
    commitConsumptionEntry(committedDraft)
      .then(function (newEntry) {
        return fetchProductionOverview(productionTargetId).then(function (result) {
          // Same reasoning as Create MRP's commit: if Creator report
          // indexing hasn't caught up to the subform rows just written,
          // fall back to the entry we just built from the confirmed draft
          // so the tabs reflect it immediately.
          const entries =
            result.consumptionEntries && result.consumptionEntries.length ? result.consumptionEntries : [newEntry];
          setData({ ...result, consumptionEntries: entries });
        });
      })
      .then(function () {
        setConsumptionDialogOpen(false);
        setConsumptionDraft(null);
      })
      .catch(function (err: any) {
        setConsumptionCommitError(
          (err && err.message) || "Failed to complete production. Please try again.",
        );
      })
      .finally(function () {
        committingConsumptionRef.current = false;
        setConsumptionCommitting(false);
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

  const { record, mrpRecord, procurementRecords, consumptionEntries } = data;
  const procurementSkipped = !!mrpRecord && !isProcurementRequired(record.status);
  const neededItems = (data.mrpDetails?.rawMaterials || []).filter((rm) => rm.status === "Needs Purchase");
  const stageKey = stageKeyFromStatus(record.status);
  const currentIndex = stageIndex(stageKey);
  const isFullyComplete = stageKey === "consumption_entry";
  const progressPercent = computeProgress(currentIndex, procurementSkipped);

  return (
    <Box sx={{ width: "100%", maxWidth: 1380, mx: "auto", p: { xs: 1.5, sm: 2.5, md: 3.5 } }}>
      <ProjectHeader
        record={record}
        progressPercent={progressPercent}
        onBack={() => window.history.back()}
      />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1fr 340px", xl: "1fr 360px" },
          alignItems: "start",
          gap: { xs: 2.5, md: 3 },
          mt: { xs: 2.5, md: 3 },
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0, width: "100%" }}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: "16px",
              p: { xs: 1, sm: 1.5 },
              border: "1px solid #E2E8F0",
              bgcolor: "#FFFFFF",
              boxShadow: "0 2px 12px rgba(15, 23, 42, 0.04)",
            }}
          >
            <PipelineStepper
              currentStageKey={stageKey}
              currentIndex={currentIndex}
              isFullyComplete={isFullyComplete}
              procurementSkipped={procurementSkipped}
            />
          </Paper>

          <Paper
            elevation={0}
            sx={{
              borderRadius: "16px",
              border: "1px solid #E2E8F0",
              bgcolor: "#FFFFFF",
              boxShadow: "0 2px 12px rgba(15, 23, 42, 0.04)",
              overflow: "hidden",
            }}
          >
            <Tabs
              value={activeTab}
              onChange={(_, v) => setActiveTab(v)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                px: { xs: 1, sm: 2 },
                bgcolor: "#F8FAFC",
                borderBottom: "1px solid #E2E8F0",
                minHeight: 48,
                "& .MuiTab-root": {
                  fontWeight: 600,
                  fontSize: { xs: 13, sm: 13.5 },
                  textTransform: "none",
                  minHeight: 48,
                  px: { xs: 1.75, sm: 2.5 },
                  color: "#64748B",
                  "&.Mui-selected": {
                    color: "#2563EB",
                    fontWeight: 700,
                  },
                },
                "& .MuiTabs-indicator": {
                  height: 3,
                  borderRadius: "3px 3px 0 0",
                  backgroundColor: "#2563EB",
                },
              }}
            >
              {TABS.map((t) => (
                <Tab key={t.key} value={t.key} label={t.label} />
              ))}
            </Tabs>

            <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
              {activeTab === "overview" && (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
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
                      {/* Outer container with soft light-blue glow */}
                      <Paper
                        elevation={0}
                        variant="outlined"
                        sx={{
                          position: "relative",
                          p: { xs: 2, sm: 2.5 },
                          borderRadius: "16px",
                          borderColor: "rgba(59, 130, 246, 0.25)",
                          bgcolor: "#FFFFFF",
                          boxShadow: "0 0 24px rgba(59, 130, 246, 0.2)",
                          overflow: "hidden",
                        }}
                      >
                        {/* Dimmed/muted card grid so stamp pops without losing legibility */}
                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                            gap: 2,
                            opacity: 0.78,
                            filter: "contrast(0.95)",
                            "& .MuiPaper-root": {
                              bgcolor: "#F8FAFC",
                              borderColor: "#E2E8F0",
                            },
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

                        {/* Bright, high-contrast, perfectly centered stamp */}
                        <StatusStamp
                          text={record.status === "Completed" ? "Production Completed" : "Production Started"}
                          color={record.status === "Completed" ? "#059669" : "#2563eb"}
                        />
                      </Paper>

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
                  {record.status === "In Progress" ? (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                          gap: 2,
                        }}
                      >
                        <InfoCard label="Production Target ID" value={record.productionTargetId} />
                        <InfoCard label="Start Date" value={record.startDate} />
                        <InfoCard label="End Date" value={record.endDate} />
                        <InfoCard label="Assigned To" value={record.assignedTo} />
                        <InfoCard label="Status" valueNode={<StatusChip value={record.status} />} />
                      </Box>

                      <Box sx={{ display: "flex", justifyContent: "center", pt: 1 }}>
                        <Button
                          variant="contained"
                          color="success"
                          size="large"
                          startIcon={<TaskAltIcon />}
                          onClick={handleOpenCompleteProduction}
                          sx={{
                            borderRadius: "12px",
                            textTransform: "none",
                            fontWeight: 700,
                            px: 3.5,
                            py: 1.25,
                            boxShadow: "0 8px 20px rgba(5, 150, 105, 0.25)",
                          }}
                        >
                          Complete Production
                        </Button>
                      </Box>
                    </Box>
                  ) : record.status === "Completed" ? (
                    <CenteredStateCard
                      icon={<EmojiEventsOutlinedIcon sx={{ fontSize: 28 }} />}
                      iconBg="#ECFDF5"
                      iconColor="#059669"
                      title="Production Completed"
                      description="Consumption has been logged and this run is fully wrapped up. See the Consumption Entry tab for the full breakdown."
                    />
                  ) : (
                    <CenteredStateCard
                      icon={<PlayCircleIcon sx={{ fontSize: 28 }} />}
                      title="Not In Progress Yet"
                      description="Start production from the Initiate Production tab first."
                    />
                  )}
                </Box>
              )}

              {activeTab === "consumption_entry" && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {consumptionEntries.length ? (
                    consumptionEntries.map((entry) => (
                      <Paper key={entry.id} variant="outlined" sx={{ borderRadius: "14px", overflow: "hidden" }}>
                        <Box
                          sx={{
                            px: 2.5,
                            py: 1.75,
                            bgcolor: "#ECFDF5",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: 1,
                          }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <TaskAltIcon sx={{ color: "#059669" }} />
                            <Box>
                              <Typography sx={{ fontWeight: 700 }}>{entry.consumptionId}</Typography>
                              <Typography sx={{ fontSize: 12, color: "#64748B" }}>{entry.date}</Typography>
                            </Box>
                          </Box>
                          {entry.remarks && (
                            <Typography sx={{ fontSize: 13, color: "#475569", fontStyle: "italic" }}>
                              "{entry.remarks}"
                            </Typography>
                          )}
                        </Box>

                        <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2.5 }}>
                          {entry.finishedGoods.length > 0 && (
                            <Box>
                              <Typography sx={{ fontWeight: 700, fontSize: 13, mb: 1 }}>Finished Goods</Typography>
                              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: "10px" }}>
                                <Table size="small">
                                  <TableHead>
                                    <TableRow sx={{ "& th": { fontWeight: 700, bgcolor: "#F8FAFC" } }}>
                                      <TableCell>Item</TableCell>
                                      <TableCell align="right">Target</TableCell>
                                      <TableCell align="right">Produced</TableCell>
                                      <TableCell align="right">Scrap</TableCell>
                                      <TableCell>Batch No</TableCell>
                                      <TableCell>Expiry</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {entry.finishedGoods.map((fg) => (
                                      <TableRow key={fg.id}>
                                        <TableCell>{fg.itemName}</TableCell>
                                        <TableCell align="right">{fg.targetQuantity}</TableCell>
                                        <TableCell align="right">{fg.producedQuantity}</TableCell>
                                        <TableCell align="right">{fg.scrapQuantity}</TableCell>
                                        <TableCell>{fg.batchNo || "—"}</TableCell>
                                        <TableCell>{fg.expiryDate || "—"}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            </Box>
                          )}

                          {entry.rawMaterials.length > 0 && (
                            <Box>
                              <Typography sx={{ fontWeight: 700, fontSize: 13, mb: 1 }}>
                                Raw Materials Consumed
                              </Typography>
                              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: "10px" }}>
                                <Table size="small">
                                  <TableHead>
                                    <TableRow sx={{ "& th": { fontWeight: 700, bgcolor: "#F8FAFC" } }}>
                                      <TableCell>Raw Material</TableCell>
                                      <TableCell>UOM</TableCell>
                                      <TableCell align="right">Allocated</TableCell>
                                      <TableCell align="right">Consumed</TableCell>
                                      <TableCell align="right">Scrap</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {entry.rawMaterials.map((rm) => (
                                      <TableRow key={rm.id}>
                                        <TableCell>{rm.productName}</TableCell>
                                        <TableCell>{rm.uom}</TableCell>
                                        <TableCell align="right">{rm.allocatedQuantity}</TableCell>
                                        <TableCell align="right">{rm.consumedQuantity}</TableCell>
                                        <TableCell align="right">{rm.scrapQuantity}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            </Box>
                          )}
                        </Box>
                      </Paper>
                    ))
                  ) : (
                    <CenteredStateCard
                      icon={<AssignmentTurnedInIcon sx={{ fontSize: 28 }} />}
                      title="No Consumption Entries Yet"
                      description="Once production is completed, the logged consumption details will appear here."
                    />
                  )}
                </Box>
              )}
            </Box>
          </Paper>
        </Box>

        <ActivityTimeline
          currentIndex={currentIndex}
          isFullyComplete={isFullyComplete}
          procurementSkipped={procurementSkipped}
          record={record}
          mrpRecord={mrpRecord}
          procurementRecords={procurementRecords}
          consumptionEntries={consumptionEntries}
        />
      </Box>

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

      <ConsumptionEntryDialog
        open={consumptionDialogOpen}
        draft={consumptionDraft}
        draftError={consumptionDraftError}
        committing={consumptionCommitting}
        commitError={consumptionCommitError}
        onDraftChange={setConsumptionDraft}
        onCancel={handleCancelConsumptionDraft}
        onConfirm={handleConfirmConsumptionEntry}
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
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 1.5, sm: 2 },
        borderRadius: "12px",
        borderColor: "#E2E8F0",
        bgcolor: "#F8FAFC",
        transition: "transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease",
        "&:hover": {
          borderColor: "#CBD5E1",
          bgcolor: "#FFFFFF",
          boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
        },
      }}
    >
      <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: "#64748B", mb: 0.5, letterSpacing: "0.01em" }}>
        {label}
      </Typography>
      {valueNode || (
        <Typography sx={{ fontWeight: 700, fontSize: { xs: 13.5, sm: 14.5 }, color: "#0F172A", wordBreak: "break-word" }}>
          {value || "—"}
        </Typography>
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
        p: { xs: 3, sm: 4 },
        borderRadius: "16px",
        textAlign: "center",
        bgcolor: "#FAFBFD",
        borderStyle: "dashed",
        borderColor: "#CBD5E1",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        boxShadow: "0 2px 8px rgba(15, 23, 42, 0.02)",
      }}
    >
      <Box
        sx={{
          width: 52,
          height: 52,
          borderRadius: "14px",
          bgcolor: iconBg,
          color: iconColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 4px 12px ${iconColor}20`,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ maxWidth: 480 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 16.5, color: "#0F172A", mb: 0.75 }}>
          {title}
        </Typography>
        {description && (
          <Typography sx={{ fontSize: 13.5, color: "#64748B", lineHeight: 1.5 }}>
            {description}
          </Typography>
        )}
      </Box>
      {action}
    </Paper>
  );
}

// A classic rotated "ink stamp" overlay — sits on top of whatever's behind
// it (pointer-events disabled). Centered vertically and horizontally over the
// parent container without being affected by child opacity.
function StatusStamp({ text, color = "#2563eb" }: { text: string; color?: string }) {
  return (
    <Box
      aria-hidden
      sx={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%) rotate(-10deg)",
        transformOrigin: "center center",
        pointerEvents: "none",
        zIndex: 2,
        userSelect: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box
        sx={{
          position: "relative",
          border: `3.5px solid ${color}`,
          borderRadius: "10px",
          color: color,
          bgcolor: "rgba(255, 255, 255, 0.88)",
          backdropFilter: "blur(2px)",
          boxShadow: `0 4px 16px ${color === "#059669" ? "rgba(5, 150, 105, 0.2)" : "rgba(37, 99, 235, 0.2)"}`,
          fontWeight: 800,
          fontSize: { xs: 17, sm: 22, md: 24 },
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          px: { xs: 2.5, sm: 3.5 },
          py: { xs: 0.75, sm: 1.2 },
          opacity: 0.95,
          whiteSpace: "nowrap",
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 4,
            border: `1.5px solid ${color}`,
            borderRadius: "6px",
          },
        }}
      >
        {text}
      </Box>
    </Box>
  );
}

import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Box,
  Tab,
  Tabs,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton,
  Tooltip,
  Chip,
  CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DownloadIcon from "@mui/icons-material/Download";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import ShoppingCartCheckoutIcon from "@mui/icons-material/ShoppingCartCheckout";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CloseIcon from "@mui/icons-material/Close";
import ProjectHeader from "./ProjectHeader";
import PipelineStepper from "./PipelineStepper";
import ActivityTimeline from "./ActivityTimeline";
import StatusChip from "./StatusChip";
import FoodProductionLoader from "./FoodProductionLoader";
import ModernSnackbar from "./common/ModernSnackbar";
import { CAN_HOVER, PHONE, stackedTableSx } from "./common/responsive";
import {
  checkStockForMrp,
  commitMrpDraft,
  commitConsumptionEntry,
  commitCreatePo,
  commitReceivePo,
  fetchEmployees,
  fetchPaymentTerms,
  fetchTaxTypes,
  fetchProductionOverview,
  fetchSuppliers,
  prepareConsumptionDraft,
  prepareCreatePoDraft,
  prepareMrpDraft,
  prepareReceivePoDraft,
  startProduction,
  allocateAndCommitBatch,
  fetchBatchAllocationsForProductionTarget,
} from "../services/productionApi";
import {
  computeProgress,
  initialTabForStatus,
  isProcurementRequired,
  stageIndex,
  stageKeyFromStatus,
} from "../config/stages.config";
import type {
  BatchAllocationLine,
  ConsumptionEntryDraft,
  ConsumptionEntryRow,
  CreatePoDraft,
  EmployeeOption,
  FinishedGoodTargetRow,
  MrpDetailData,
  MrpDraft,
  MrpRow,
  NonStockItemRow,
  PaymentTermOption,
  RawMaterialNeedRow,
  TaxOption,
  ProductionInProgressRow,
  ProductionTargetRow,
  PurchaseOrderDetail,
  ReceivePoDraft,
  SupplierOption,
} from "../types";

const CreateMrpDialog = lazy(() => import("./CreateMrpDialog"));
const InitiateProductionDialog = lazy(
  () => import("./InitiateProductionDialog"),
);
const ConsumptionEntryDialog = lazy(() => import("./ConsumptionEntryDialog"));
const CreatePoDialog = lazy(() => import("./CreatePoDialog"));
const ReceivePoDialog = lazy(() => import("./ReceivePoDialog"));
// Only needed on the MRP tab — same code-splitting treatment as the
// dialogs above, keeps it out of the main bundle for everyone who never
// opens that tab.
const MrpReportView = lazy(() => import("./MrpReportView"));

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "mrp", label: "MRP" },
  { key: "procurement", label: "Procurement" },
  { key: "initiate_production", label: "Initiate Production" },
  { key: "in_progress", label: "In-Progress" },
  { key: "consumption_entry", label: "Consumption Entry" },
];

// Shared table chrome — same soft-border/rounded/hover treatment as
// MrpReportView's tables, reused here so every plain data table in this file
// (Non-Stock Items, PO Lines, Finished Goods, Consumption Entry's two
// tables) reads as one consistent design instead of a mix of styles.
// Purely presentational — never touches column content or row data.
//
// overflowX is "auto", not "hidden": with "hidden" a table wider than the
// screen was silently clipped on phones, leaving its right-hand columns
// unreachable. The rounded corners still clip the scrolling content.
const TABLE_CONTAINER_SX = {
  borderRadius: "14px",
  borderColor: "rgba(148,163,184,0.25)",
  boxShadow: "0 4px 16px rgba(15, 23, 42, 0.04)",
  overflowX: "auto",
  WebkitOverflowScrolling: "touch",
} as const;

const TABLE_HEAD_ROW_SX = {
  "& th": {
    fontWeight: 700,
    color: "#475569",
    bgcolor: "rgba(241,245,249,0.65)",
    borderBottom: "1px solid rgba(148,163,184,0.3)",
    py: 1.1,
  },
} as const;

function tableRowSx(clickable = false) {
  return {
    transition: "background-color 120ms ease",
    "&:hover": { bgcolor: "rgba(37,99,235,0.035)" },
    "&:last-child td, &:last-child th": { border: 0 },
    ...(clickable ? { cursor: "pointer" } : {}),
  };
}

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
  nonStockItems: NonStockItemRow[];
  procurementRecords: PurchaseOrderDetail[];
  productionInProgress: ProductionInProgressRow[];
  consumptionEntries: ConsumptionEntryRow[];
  finishedGoodsForTarget: FinishedGoodTargetRow[];
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
  // Which batch(es) each raw material was drawn from, per the last
  // AllocateAndCommitBatch call — only lives in this component's state
  // (no persistent record is created for it), so it's populated right
  // after Start Production and shown for the rest of this session.
  const [batchAllocations, setBatchAllocations] = useState<
    BatchAllocationLine[]
  >([]);

  // Complete Production: dialog prefilled from the Production Target's own
  // finished goods + the MRP's allocated raw materials (mirrors the native
  // "Complete Production" custom action, which opens this same form).
  const [consumptionDialogOpen, setConsumptionDialogOpen] = useState(false);
  const [consumptionDraft, setConsumptionDraft] =
    useState<ConsumptionEntryDraft | null>(null);
  const [consumptionDraftError, setConsumptionDraftError] = useState("");
  const [consumptionCommitError, setConsumptionCommitError] = useState("");
  const [consumptionCommitting, setConsumptionCommitting] = useState(false);
  const preparingConsumptionRef = useRef(false);
  const committingConsumptionRef = useRef(false);

  // Procurement: select shortfall items → Create Purchase Order.
  const [selectedNonStockItemIds, setSelectedNonStockItemIds] = useState<
    string[]
  >([]);
  const [createPoDialogOpen, setCreatePoDialogOpen] = useState(false);
  const [createPoDraft, setCreatePoDraft] = useState<CreatePoDraft | null>(
    null,
  );
  const [createPoDraftError, setCreatePoDraftError] = useState("");
  const [createPoCommitError, setCreatePoCommitError] = useState("");
  const [createPoCommitting, setCreatePoCommitting] = useState(false);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [paymentTerms, setPaymentTerms] = useState<PaymentTermOption[]>([]);
  const [taxTypes, setTaxTypes] = useState<TaxOption[]>([]);
  const preparingCreatePoRef = useRef(false);
  const committingCreatePoRef = useRef(false);

  // Procurement: Check Stock — re-checks the MRP's still-short raw
  // materials against the warehouse's current Available_Stocks.
  const [checkStockRunning, setCheckStockRunning] = useState(false);
  const [checkStockError, setCheckStockError] = useState("");
  const [stockStillShortOpen, setStockStillShortOpen] = useState(false);
  const [stockShortItems, setStockShortItems] = useState<NonStockItemRow[]>([]);
  const [checkStockSuccessOpen, setCheckStockSuccessOpen] = useState(false);
  const [checkStockWarningOpen, setCheckStockWarningOpen] = useState(false);
  // Prompted right after a Purchase Receive completes and it turns out that
  // was the last outstanding PO for this MRP (every PO's derived status is
  // now "Received") — the natural moment to suggest re-checking stock,
  // since procurement for this run is fully done.
  const [postReceiveCheckPromptOpen, setPostReceiveCheckPromptOpen] =
    useState(false);
  // Shared success snackbar for every other commit action (Create MRP,
  // Start Production, Create PO, Receive PO, Complete Production) — each
  // is a distinct user-initiated action so there's never more than one
  // in flight at a time, hence one shared message is enough.
  const [successMessage, setSuccessMessage] = useState("");
  const checkingStockRef = useRef(false);

  // Procurement: Receive a Purchase Order.
  const [receivePoDialogOpen, setReceivePoDialogOpen] = useState(false);
  const [receivingPo, setReceivingPo] = useState<PurchaseOrderDetail | null>(
    null,
  );
  const [receivePoDraft, setReceivePoDraft] = useState<ReceivePoDraft | null>(
    null,
  );
  const [receivePoDraftError, setReceivePoDraftError] = useState("");
  const [receivePoCommitError, setReceivePoCommitError] = useState("");
  const [receivePoCommitting, setReceivePoCommitting] = useState(false);
  const preparingReceivePoRef = useRef(false);
  const committingReceivePoRef = useRef(false);

  useEffect(() => {
    setLoading(true);
    fetchProductionOverview(productionTargetId).then(function (result) {
      setData(result);
      setLoading(false);
      // Land on the tab where this record's next action actually lives
      // (e.g. opened from the "Waiting for Stock" report → Procurement)
      // instead of always defaulting to Overview. Only happens on this
      // initial load, not on the refetches after committing a dialog.
      if (result.record) {
        setActiveTab(initialTabForStatus(result.record.status));
      }
      // Restore the batch allocation breakdown on a fresh page load/reload —
      // it's a real FEFO_Batch_Allocation record AllocateAndCommitBatch
      // wrote, not something that only lived in this component's state, so
      // it's there for any run that already started.
      if (
        result.record &&
        (result.record.status === "In Progress" ||
          result.record.status === "Completed")
      ) {
        fetchBatchAllocationsForProductionTarget(result.record.id).then(
          function (allocations) {
            setBatchAllocations(allocations);
          },
        );
      }
    });
  }, [productionTargetId]);

  // Stable reference (rather than an inline arrow at the call site) so
  // ProjectHeader's React.memo actually skips re-rendering it when nothing
  // it cares about has changed.
  const handleBack = useCallback(() => {
    window.history.back();
  }, []);

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
        setSuccessMessage(`${committedDraft.mrpId} created successfully.`);
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
    const productionTargetRecordId = data.record.id;
    Promise.all([
      startProduction(productionTargetRecordId, {
        startDate,
        endDate,
        assignedToId,
      }),
      allocateAndCommitBatch(productionTargetRecordId),
    ])
      .then(function () {
        // Read the FEFO_Batch_Allocation record AllocateAndCommitBatch just
        // wrote, rather than trying to parse its own response — that's also
        // what makes this breakdown survive a page reload later.
        return fetchBatchAllocationsForProductionTarget(
          productionTargetRecordId,
        );
      })
      .then(function (allocations) {
        setBatchAllocations(allocations);
        return fetchProductionOverview(productionTargetId).then(
          function (result) {
            setData(result);
          },
        );
      })
      .then(function () {
        setPoDialogOpen(false);
        setSuccessMessage("Production started successfully.");
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
    prepareConsumptionDraft(
      data.record.id,
      productionTargetId,
      data.mrpRecord?.id || "",
    )
      .then(function (draft) {
        setConsumptionDraft(draft);
      })
      .catch(function (err: any) {
        setConsumptionDraftError(
          (err && err.message) ||
            "Failed to prepare the consumption entry. Please try again.",
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
        // Close the dialog as soon as the write succeeds. On some browsers
        // the follow-up overview refresh can lag or stall, and we do not want
        // the modal visibility to depend on that second, best-effort step.
        setConsumptionDialogOpen(false);
        setConsumptionDraft(null);
        setConsumptionDraftError("");
        setConsumptionCommitError("");
        setSuccessMessage("Production completed successfully.");

        return fetchProductionOverview(productionTargetId)
          .then(function (result) {
            // Same reasoning as Create MRP's commit: if Creator report
            // indexing hasn't caught up to the subform rows just written,
            // fall back to the entry we just built from the confirmed draft
            // so the tabs reflect it immediately.
            const entries =
              result.consumptionEntries && result.consumptionEntries.length
                ? result.consumptionEntries
                : [newEntry];
            setData({ ...result, consumptionEntries: entries });
          })
          .catch(function (refreshErr: any) {
            // The commit already succeeded, so keep the UI responsive even if
            // the refresh path fails temporarily. We still update the current
            // page with the confirmed entry so the user is not left looking at
            // stale data.
            console.error(
              "Failed to refresh production overview after completing production.",
              refreshErr,
            );
            setData(function (prev) {
              if (!prev) return prev;
              const nextEntries =
                prev.consumptionEntries && prev.consumptionEntries.length
                  ? prev.consumptionEntries
                  : [newEntry];
              return {
                ...prev,
                record: prev.record
                  ? { ...prev.record, status: "Completed" }
                  : prev.record,
                consumptionEntries: nextEntries,
              };
            });
          });
      })
      .then(function () {
        // No-op: the dialog is already closed once the commit succeeds.
      })
      .catch(function (err: any) {
        setConsumptionCommitError(
          (err && err.message) ||
            "Failed to complete production. Please try again.",
        );
      })
      .finally(function () {
        committingConsumptionRef.current = false;
        setConsumptionCommitting(false);
      });
  }

  function handleToggleSelectNonStockItem(id: string) {
    setSelectedNonStockItemIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  // Header "select all" checkbox for the Needed Items table — lets a
  // customer raising one combined PO for every shortfall item select them
  // all in one click instead of ticking each row individually. Toggles:
  // everything selected -> clear; anything else (none or some) -> select
  // every currently-visible needsPurchaseItems row.
  function handleToggleSelectAllNonStockItems() {
    setSelectedNonStockItemIds((prev) =>
      prev.length === needsPurchaseItems.length
        ? []
        : needsPurchaseItems.map((item) => item.id),
    );
  }

  function handleOpenCreatePo() {
    if (!data || !data.mrpRecord) return;
    const selectedItems = (data.nonStockItems || []).filter((item) =>
      selectedNonStockItemIds.includes(item.id),
    );
    if (!selectedItems.length) return;
    if (preparingCreatePoRef.current) return;
    preparingCreatePoRef.current = true;
    setCreatePoDialogOpen(true);
    setCreatePoDraft(null);
    setCreatePoDraftError("");
    setCreatePoCommitError("");
    Promise.all([
      prepareCreatePoDraft(data.mrpRecord.id, selectedItems),
      fetchSuppliers(),
      fetchPaymentTerms(),
      fetchTaxTypes(),
    ])
      .then(function (results) {
        setCreatePoDraft(results[0]);
        setSuppliers(results[1]);
        setPaymentTerms(results[2]);
        setTaxTypes(results[3]);
      })
      .catch(function (err: any) {
        setCreatePoDraftError(
          (err && err.message) ||
            "Failed to prepare the Purchase Order. Please try again.",
        );
      })
      .finally(function () {
        preparingCreatePoRef.current = false;
      });
  }

  function handleCancelCreatePoDraft() {
    if (committingCreatePoRef.current) return;
    setCreatePoDialogOpen(false);
    setCreatePoDraft(null);
    setCreatePoDraftError("");
    setCreatePoCommitError("");
  }

  function handleConfirmCreatePo() {
    if (!createPoDraft) return;
    if (committingCreatePoRef.current) return;
    committingCreatePoRef.current = true;
    setCreatePoCommitting(true);
    setCreatePoCommitError("");
    commitCreatePo(createPoDraft)
      .then(function () {
        return fetchProductionOverview(productionTargetId).then(
          function (result) {
            setData(result);
          },
        );
      })
      .then(function () {
        setCreatePoDialogOpen(false);
        setCreatePoDraft(null);
        setSelectedNonStockItemIds([]);
        setSuccessMessage("Purchase Order created successfully.");
      })
      .catch(function (err: any) {
        setCreatePoCommitError(
          (err && err.message) ||
            "Failed to create the Purchase Order. Please try again.",
        );
      })
      .finally(function () {
        committingCreatePoRef.current = false;
        setCreatePoCommitting(false);
      });
  }

  function handleCheckStock() {
    if (!data || !data.mrpRecord) return;
    if (checkingStockRef.current) return;
    checkingStockRef.current = true;
    setCheckStockRunning(true);
    setCheckStockError("");
    checkStockForMrp(data.mrpRecord.id)
      .then(function () {
        return fetchProductionOverview(productionTargetId).then(
          function (result) {
            setData(result);
            // Items with no PO raised yet — let the user pick them and raise
            // one, same as before.
            const needsPurchase = (result.nonStockItems || []).filter(
              (item) => item.status === "Needs Purchase",
            );
            if (needsPurchase.length > 0) {
              setStockShortItems(needsPurchase);
              setStockStillShortOpen(true);
              return;
            }
            // Everything already has a PO raised, so there's nothing left to
            // select — but Non_Stock_Items.Status stays "PO Created" forever
            // and never reflects whether the goods actually arrived.
            // Production_Target.Status is what MRP.CheckStock just
            // re-validated and (now that its Production_Targets[ID==...]
            // lookup correctly uses .ID) actually updates, so it's the
            // authoritative "is this genuinely resolved" signal here.
            if (result.record && result.record.status === "Waiting for Stock") {
              setCheckStockWarningOpen(true);
            } else {
              setCheckStockSuccessOpen(true);
            }
          },
        );
      })
      .catch(function (err: any) {
        setCheckStockError(
          (err && err.message) || "Failed to check stock. Please try again.",
        );
      })
      .finally(function () {
        checkingStockRef.current = false;
        setCheckStockRunning(false);
      });
  }

  function handleOpenReceivePo(po: PurchaseOrderDetail) {
    if (preparingReceivePoRef.current) return;
    preparingReceivePoRef.current = true;
    setReceivingPo(po);
    setReceivePoDialogOpen(true);
    setReceivePoDraft(null);
    setReceivePoDraftError("");
    setReceivePoCommitError("");
    prepareReceivePoDraft(po)
      .then(function (draft) {
        setReceivePoDraft(draft);
      })
      .catch(function (err: any) {
        setReceivePoDraftError(
          (err && err.message) ||
            "Failed to prepare the receipt. Please try again.",
        );
      })
      .finally(function () {
        preparingReceivePoRef.current = false;
      });
  }

  function handleCancelReceivePoDraft() {
    if (committingReceivePoRef.current) return;
    setReceivePoDialogOpen(false);
    setReceivingPo(null);
    setReceivePoDraft(null);
    setReceivePoDraftError("");
    setReceivePoCommitError("");
  }

  function handleConfirmReceivePo() {
    if (!receivePoDraft) return;
    if (committingReceivePoRef.current) return;
    committingReceivePoRef.current = true;
    setReceivePoCommitting(true);
    setReceivePoCommitError("");
    commitReceivePo(receivePoDraft)
      .then(function () {
        return fetchProductionOverview(productionTargetId).then(
          function (result) {
            setData(result);
            // Every PO for this MRP is now fully received — procurement for
            // this run is done, so this is the natural moment to prompt a
            // fresh stock check rather than leaving the user to remember to
            // click it themselves.
            const records = result.procurementRecords || [];
            const allReceived =
              records.length > 0 &&
              records.every((po) => po.status === "Received");
            if (allReceived) {
              setPostReceiveCheckPromptOpen(true);
            }
          },
        );
      })
      .then(function () {
        setReceivePoDialogOpen(false);
        setReceivingPo(null);
        setReceivePoDraft(null);
        setSuccessMessage("Purchase Order receipt recorded successfully.");
      })
      .catch(function (err: any) {
        setReceivePoCommitError(
          (err && err.message) ||
            "Failed to record the receipt. Please try again.",
        );
      })
      .finally(function () {
        committingReceivePoRef.current = false;
        setReceivePoCommitting(false);
      });
  }

  function handlePostReceiveCheckStock() {
    setPostReceiveCheckPromptOpen(false);
    handleCheckStock();
  }

  function handlePostReceiveCheckLater() {
    setPostReceiveCheckPromptOpen(false);
  }

  if (loading) {
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

  // The fetch finished but no Production_Targets row matched — a genuinely
  // missing/deleted record, or a stale link. Show that plainly instead of
  // the loader spinning forever (loading is already false at this point).
  if (!data || !data.record) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          gap: 1,
          textAlign: "center",
          px: 3,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Production Target not found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No Production Target matches "{productionTargetId}". It may have been
          deleted, or the link that opened this page may be out of date.
        </Typography>
      </Box>
    );
  }

  const {
    record,
    mrpRecord,
    procurementRecords,
    consumptionEntries,
    finishedGoodsForTarget,
  } = data;
  // Procurement is only truly "skipped" (i.e. all materials were in stock and
  // no POs needed) when the MRP exists, the target is past the procurement
  // stage, AND no Purchase Orders were ever raised for this run. If POs exist,
  // the team went through procurement even if the status has since moved on —
  // show those POs in the Procurement tab and count the stage as done, not
  // skipped, so the pipeline stepper and activity timeline reflect reality.
  const procurementSkipped =
    !!mrpRecord &&
    !isProcurementRequired(record.status) &&
    procurementRecords.length === 0;
  // Non_Stock_Items is the source of truth here (not Raw_Materials) — once a
  // PO is raised for an item its Status flips to "PO Created" and it drops
  // out of this list, matching the native Non_Stock_Items_Report filter.
  const needsPurchaseItems = (data.nonStockItems || []).filter(
    (item) => item.status === "Needs Purchase",
  );
  const stageKey = stageKeyFromStatus(record.status);
  const currentIndex = stageIndex(stageKey);
  const isFullyComplete = stageKey === "consumption_entry";
  const progressPercent = computeProgress(currentIndex, procurementSkipped);

  return (
    <Box sx={{ width: "100%", p: { xs: 1.5, sm: 2.5, md: 3.5, xl: 5 } }}>
      <ProjectHeader
        record={record}
        progressPercent={progressPercent}
        onBack={handleBack}
      />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1fr 340px", xl: "1fr 360px" },
          alignItems: "stretch",
          gap: { xs: 2.5, md: 3 },
          mt: { xs: 2.5, md: 3 },
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: { xs: 2, md: 3 },
            minWidth: 0,
            width: "100%",
          }}
        >
          <Paper
            elevation={0}
            sx={{
              borderRadius: "20px",
              p: { xs: 1, sm: 1.5 },
              boxShadow:
                "0 10px 32px rgba(37, 99, 235, 0.07), 0 2px 8px rgba(15, 23, 42, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.85)",
            }}
          >
            <PipelineStepper
              currentStageKey={stageKey}
              currentIndex={currentIndex}
              isFullyComplete={isFullyComplete}
              procurementSkipped={procurementSkipped}
              onStageClick={setActiveTab}
              renderStageExtra={(stageKeyForStage) =>
                stageKeyForStage === "procurement" &&
                record.status === "Waiting for Stock" ? (
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleCheckStock}
                    disabled={checkStockRunning || !mrpRecord}
                    sx={{
                      borderRadius: "8px",
                      textTransform: "none",
                      fontWeight: 700,
                      fontSize: { xs: 12.5, sm: 11.5 },
                      px: 1.35,
                      py: 0.35,
                      minWidth: 0,
                    }}
                  >
                    {checkStockRunning ? "Checking…" : "Check Stock"}
                  </Button>
                ) : null
              }
            />
          </Paper>

          <Paper
            elevation={0}
            sx={{
              borderRadius: "20px",
              boxShadow:
                "0 12px 35px rgba(37, 99, 235, 0.07), 0 2px 8px rgba(15, 23, 42, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.85)",
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
                bgcolor: "rgba(241,245,249,0.55)",
                borderBottom: "1px solid rgba(148,163,184,0.18)",
                minHeight: 52,
                "& .MuiTab-root": {
                  fontWeight: 600,
                  fontSize: { xs: 13, sm: 13.5 },
                  textTransform: "none",
                  minHeight: 52,
                  px: { xs: 1.75, sm: 2.75 },
                  py: 1.5,
                  color: "#64748B",
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  "&:hover": {
                    color: "#2563EB",
                    backgroundColor: "rgba(37,99,235,0.05)",
                  },
                  "&.Mui-selected": {
                    color: "#2563EB",
                    fontWeight: 800,
                  },
                },
                "& .MuiTabs-indicator": {
                  height: 3.5,
                  borderRadius: "4px 4px 0 0",
                  background:
                    "linear-gradient(90deg, #2563EB 0%, #3B82F6 100%)",
                  boxShadow: "0 2px 10px rgba(37, 99, 235, 0.45)",
                },
              }}
            >
              {TABS.map((t) => (
                <Tab key={t.key} value={t.key} label={t.label} />
              ))}
            </Tabs>

            <Box
              sx={{
                p: { xs: 1.5, sm: 2.5, md: 3.5 },
                animation: "fadeIn 0.35s ease-out",
              }}
              key={activeTab}
            >
              {activeTab === "overview" && (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: { xs: 2.5, sm: 3 },
                  }}
                >
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "repeat(2, minmax(0, 1fr))",
                        md: "repeat(4, minmax(0, 1fr))",
                      },
                      gap: { xs: 1.5, sm: 2 },
                    }}
                  >
                    <InfoCard
                      label="Production Target ID"
                      value={record.productionTargetId}
                    />
                    <InfoCard label="Date" value={record.date} />
                    <InfoCard
                      label="Assigned To"
                      value={record.assignedTo}
                      wideOnPhone
                    />
                    <InfoCard
                      label="Current Status"
                      valueNode={<StatusChip value={record.status} />}
                      wideOnPhone
                    />
                  </Box>

                  {finishedGoodsForTarget.length > 0 && (
                    <Box>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 1.25,
                        }}
                      >
                        <Inventory2OutlinedIcon
                          sx={{ color: "#2563eb", fontSize: 19 }}
                        />
                        <Typography
                          sx={{
                            fontWeight: 700,
                            fontSize: 15,
                            color: "#0F172A",
                          }}
                        >
                          Finished Good
                        </Typography>
                      </Box>
                      <TableContainer
                        component={Paper}
                        variant="outlined"
                        sx={TABLE_CONTAINER_SX}
                      >
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={TABLE_HEAD_ROW_SX}>
                              <TableCell>Item</TableCell>
                              <TableCell>UOM</TableCell>
                              <TableCell align="right">
                                Target Quantity
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {finishedGoodsForTarget.map((fg) => (
                              <TableRow key={fg.id} sx={tableRowSx()}>
                                <TableCell>{fg.itemName}</TableCell>
                                <TableCell>{fg.uomName}</TableCell>
                                <TableCell align="right">
                                  {fg.targetQuantity}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  )}
                </Box>
              )}

              {activeTab === "mrp" && (
                <Box>
                  {mrpRecord ? (
                    <Suspense
                      fallback={
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "center",
                            py: 4,
                          }}
                        >
                          <FoodProductionLoader
                            size="small"
                            text="Loading MRP details…"
                          />
                        </Box>
                      }
                    >
                      <MrpReportView
                        mrpRecord={mrpRecord}
                        mrpDetails={data.mrpDetails}
                        productionTarget={record}
                      />
                    </Suspense>
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
                        icon={
                          <ShoppingCartOutlinedIcon sx={{ fontSize: 28 }} />
                        }
                        iconBg="#FEF3C7"
                        iconColor="#D97706"
                        title="Procurement Needed"
                        description="Select the items below to raise a Purchase Order. Once everything has been received, this target moves on to Initiate Production automatically."
                      />

                      {checkStockError && (
                        <Typography
                          color="error"
                          sx={{ fontSize: 12.5, textAlign: "center" }}
                        >
                          {checkStockError}
                        </Typography>
                      )}

                      <Box>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            mb: 1.25,
                            flexWrap: "wrap",
                            gap: 1,
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <ShoppingCartOutlinedIcon
                              sx={{ color: "#2563eb", fontSize: 19 }}
                            />
                            <Typography
                              sx={{
                                fontWeight: 700,
                                fontSize: 15,
                                color: "#0F172A",
                              }}
                            >
                              Needed Items
                            </Typography>
                          </Box>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<ShoppingCartCheckoutIcon />}
                            disabled={!selectedNonStockItemIds.length}
                            onClick={handleOpenCreatePo}
                            sx={{
                              borderRadius: "8px",
                              textTransform: "none",
                              fontWeight: 600,
                              width: { xs: "100%", sm: "auto" },
                            }}
                          >
                            Create Purchase Order
                            {selectedNonStockItemIds.length
                              ? ` (${selectedNonStockItemIds.length})`
                              : ""}
                          </Button>
                        </Box>
                        <TableContainer
                          component={Paper}
                          variant="outlined"
                          sx={TABLE_CONTAINER_SX}
                        >
                          <Table size="small">
                            <TableHead>
                              <TableRow sx={TABLE_HEAD_ROW_SX}>
                                <TableCell padding="checkbox">
                                  <input
                                    type="checkbox"
                                    aria-label="Select all needed items"
                                    checked={
                                      needsPurchaseItems.length > 0 &&
                                      selectedNonStockItemIds.length ===
                                        needsPurchaseItems.length
                                    }
                                    ref={(el) => {
                                      if (el) {
                                        el.indeterminate =
                                          selectedNonStockItemIds.length > 0 &&
                                          selectedNonStockItemIds.length <
                                            needsPurchaseItems.length;
                                      }
                                    }}
                                    onChange={
                                      handleToggleSelectAllNonStockItems
                                    }
                                    disabled={!needsPurchaseItems.length}
                                  />
                                </TableCell>
                                <TableCell>Product Name</TableCell>
                                <TableCell>UOM</TableCell>
                                <TableCell align="right">
                                  Needed Quantity
                                </TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {needsPurchaseItems.length ? (
                                needsPurchaseItems.map((item) => (
                                  <TableRow
                                    key={item.id}
                                    hover
                                    selected={selectedNonStockItemIds.includes(
                                      item.id,
                                    )}
                                    onClick={() =>
                                      handleToggleSelectNonStockItem(item.id)
                                    }
                                    sx={tableRowSx(true)}
                                  >
                                    <TableCell padding="checkbox">
                                      <input
                                        type="checkbox"
                                        checked={selectedNonStockItemIds.includes(
                                          item.id,
                                        )}
                                        onChange={() =>
                                          handleToggleSelectNonStockItem(
                                            item.id,
                                          )
                                        }
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                    </TableCell>
                                    <TableCell>{item.productName}</TableCell>
                                    <TableCell>{item.uomName}</TableCell>
                                    <TableCell align="right">
                                      {item.neededQuantity.toFixed(2)}
                                    </TableCell>
                                  </TableRow>
                                ))
                              ) : (
                                <TableRow>
                                  <TableCell
                                    colSpan={4}
                                    align="center"
                                    sx={{ py: 3, color: "#94A3B8" }}
                                  >
                                    No shortfall items pending a Purchase Order.
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Box>

                      {procurementRecords.length > 0 && (
                        <Box>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mb: 1.25,
                            }}
                          >
                            <LocalShippingIcon
                              sx={{ color: "#2563eb", fontSize: 19 }}
                            />
                            <Typography
                              sx={{
                                fontWeight: 700,
                                fontSize: 15,
                                color: "#0F172A",
                              }}
                            >
                              Purchase Orders
                            </Typography>
                          </Box>
                          {procurementRecords.map((po) => {
                            const pending = po.lines.reduce(
                              (sum, l) =>
                                sum +
                                Math.max(
                                  0,
                                  l.orderQuantity - l.receivedQuantity,
                                ),
                              0,
                            );
                            return (
                              <Paper
                                key={po.id}
                                variant="outlined"
                                sx={{
                                  p: { xs: 1.5, sm: 1.75 },
                                  mb: 1.5,
                                  borderRadius: "14px",
                                  borderColor: "rgba(148,163,184,0.25)",
                                  boxShadow:
                                    "0 4px 16px rgba(15, 23, 42, 0.04)",
                                }}
                              >
                                <Box
                                  sx={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 1.5,
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    mb: 1,
                                  }}
                                >
                                  {/* Wraps as a unit: PO number stays whole, date and supplier
                                      drop underneath it rather than splitting "PO-/0012". */}
                                  <Box
                                    sx={{
                                      display: "flex",
                                      flexWrap: "wrap",
                                      columnGap: 1.5,
                                      rowGap: 0.25,
                                      alignItems: "baseline",
                                      minWidth: 0,
                                    }}
                                  >
                                    <Typography
                                      sx={{
                                        fontWeight: 700,
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {po.poNumber}
                                    </Typography>
                                    <Typography
                                      color="text.secondary"
                                      sx={{
                                        fontSize: 13,
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {po.poDate}
                                    </Typography>
                                    {po.supplierName && (
                                      // The "·" separator is drawn in CSS so it can disappear
                                      // on phones, where the supplier wraps onto its own line.
                                      <Typography
                                        color="text.secondary"
                                        sx={{
                                          fontSize: 13,
                                          "&::before": {
                                            content: '"· "',
                                            [PHONE]: { content: "none" },
                                          },
                                        }}
                                      >
                                        {po.supplierName}
                                      </Typography>
                                    )}
                                  </Box>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      gap: 1,
                                      alignItems: "center",
                                      flexWrap: "wrap",
                                    }}
                                  >
                                    <StatusChip value={po.status} />
                                    {pending > 0 && (
                                      <Button
                                        variant="contained"
                                        size="small"
                                        startIcon={<LocalShippingIcon />}
                                        onClick={() => handleOpenReceivePo(po)}
                                        sx={{
                                          borderRadius: "8px",
                                          textTransform: "none",
                                          fontWeight: 600,
                                        }}
                                      >
                                        Receive
                                      </Button>
                                    )}
                                  </Box>
                                </Box>
                                <TableContainer
                                  sx={[
                                    {
                                      borderRadius: "10px",
                                      overflowX: "auto",
                                      WebkitOverflowScrolling: "touch",
                                    },
                                    stackedTableSx,
                                    // Nested inside the PO card, so its line cards use the
                                    // page tint instead of a second layer of white.
                                    {
                                      [PHONE]: {
                                        "& tbody tr": { bgcolor: "#F8FAFC" },
                                      },
                                    },
                                  ]}
                                >
                                  <Table size="small">
                                    <TableHead>
                                      <TableRow sx={TABLE_HEAD_ROW_SX}>
                                        <TableCell>Product</TableCell>
                                        <TableCell align="right">
                                          Ordered
                                        </TableCell>
                                        <TableCell align="right">
                                          Received
                                        </TableCell>
                                        <TableCell align="right">
                                          Unit Price
                                        </TableCell>
                                        <TableCell align="right">
                                          Line Total
                                        </TableCell>
                                        <TableCell align="right">Tax</TableCell>
                                        <TableCell align="right">
                                          Total
                                        </TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {po.lines.map((line) => (
                                        <TableRow
                                          key={line.id}
                                          sx={tableRowSx()}
                                        >
                                          <TableCell>
                                            {line.productName}
                                          </TableCell>
                                          <TableCell
                                            align="right"
                                            data-label="Ordered"
                                            data-span="third"
                                          >
                                            {line.orderQuantity}
                                          </TableCell>
                                          <TableCell
                                            align="right"
                                            data-label="Received"
                                            data-span="third"
                                          >
                                            {line.receivedQuantity}
                                          </TableCell>
                                          <TableCell
                                            align="right"
                                            data-label="Unit Price"
                                            data-span="third"
                                          >
                                            {line.unitPrice.toFixed(2)}
                                          </TableCell>
                                          <TableCell
                                            align="right"
                                            data-label="Line Total"
                                            data-span="third"
                                          >
                                            {line.lineTotal.toFixed(2)}
                                          </TableCell>
                                          <TableCell
                                            align="right"
                                            data-label="Tax"
                                            data-span="third"
                                          >
                                            {line.taxAmount > 0
                                              ? `${line.taxAmount.toFixed(2)} (${line.taxPercentage}%)`
                                              : "—"}
                                          </TableCell>
                                          <TableCell
                                            align="right"
                                            data-label="Total"
                                            data-span="third"
                                            sx={{ fontWeight: 600 }}
                                          >
                                            {(
                                              line.lineTotal + line.taxAmount
                                            ).toFixed(2)}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </TableContainer>
                                <Box
                                  sx={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    justifyContent: "flex-end",
                                    columnGap: 0.5,
                                    mt: 1,
                                  }}
                                >
                                  <Typography
                                    sx={{ fontSize: 13, color: "#64748B" }}
                                  >
                                    Sub Total {po.subTotal.toFixed(2)}{" "}
                                    &nbsp;·&nbsp; Tax {po.taxAmount.toFixed(2)}
                                    {/* trailing separator would dangle at a line end once Grand Total wraps below */}
                                    <Box
                                      component="span"
                                      sx={{
                                        display: { xs: "none", sm: "inline" },
                                      }}
                                    >
                                      &nbsp;·&nbsp;
                                    </Box>{" "}
                                  </Typography>
                                  <Typography
                                    sx={{ fontSize: 13, fontWeight: 700 }}
                                  >
                                    Grand Total {po.grandTotal.toFixed(2)}
                                  </Typography>
                                </Box>
                              </Paper>
                            );
                          })}
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
                    // Status is neither "Waiting for Stock" nor "Completed" —
                    // materials cleared procurement. Show a completion banner
                    // and, if POs were raised as part of fulfilling the shortfall,
                    // render them beneath so users can review what was ordered.
                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 3 }}
                    >
                      <CenteredStateCard
                        icon={<CheckCircleOutlineIcon sx={{ fontSize: 28 }} />}
                        iconBg="#ECFDF5"
                        iconColor="#059669"
                        title="Procurement Complete"
                        description={
                          procurementRecords.length > 0
                            ? "All Purchase Orders have been received. Head to Initiate Production to start the run."
                            : "All raw materials are available. Head to the Initiate Production tab to start the run."
                        }
                      />

                      {procurementRecords.length > 0 && (
                        <Box>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mb: 1.25,
                            }}
                          >
                            <LocalShippingIcon
                              sx={{ color: "#2563eb", fontSize: 19 }}
                            />
                            <Typography
                              sx={{
                                fontWeight: 700,
                                fontSize: 15,
                                color: "#0F172A",
                              }}
                            >
                              Purchase Orders
                            </Typography>
                          </Box>
                          {procurementRecords.map((po) => {
                            const pending = po.lines.reduce(
                              (sum, l) =>
                                sum +
                                Math.max(
                                  0,
                                  l.orderQuantity - l.receivedQuantity,
                                ),
                              0,
                            );
                            return (
                              <Paper
                                key={po.id}
                                variant="outlined"
                                sx={{
                                  p: { xs: 1.5, sm: 1.75 },
                                  mb: 1.5,
                                  borderRadius: "14px",
                                  borderColor: "rgba(148,163,184,0.25)",
                                  boxShadow:
                                    "0 4px 16px rgba(15, 23, 42, 0.04)",
                                }}
                              >
                                <Box
                                  sx={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 1.5,
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    mb: 1,
                                  }}
                                >
                                  {/* Wraps as a unit: PO number stays whole, date and supplier
                                      drop underneath it rather than splitting "PO-/0012". */}
                                  <Box
                                    sx={{
                                      display: "flex",
                                      flexWrap: "wrap",
                                      columnGap: 1.5,
                                      rowGap: 0.25,
                                      alignItems: "baseline",
                                      minWidth: 0,
                                    }}
                                  >
                                    <Typography
                                      sx={{
                                        fontWeight: 700,
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {po.poNumber}
                                    </Typography>
                                    <Typography
                                      color="text.secondary"
                                      sx={{
                                        fontSize: 13,
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {po.poDate}
                                    </Typography>
                                    {po.supplierName && (
                                      // The "·" separator is drawn in CSS so it can disappear
                                      // on phones, where the supplier wraps onto its own line.
                                      <Typography
                                        color="text.secondary"
                                        sx={{
                                          fontSize: 13,
                                          "&::before": {
                                            content: '"· "',
                                            [PHONE]: { content: "none" },
                                          },
                                        }}
                                      >
                                        {po.supplierName}
                                      </Typography>
                                    )}
                                  </Box>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      gap: 1,
                                      alignItems: "center",
                                      flexWrap: "wrap",
                                    }}
                                  >
                                    <StatusChip value={po.status} />
                                    {pending > 0 && (
                                      <Button
                                        variant="contained"
                                        size="small"
                                        startIcon={<LocalShippingIcon />}
                                        onClick={() => handleOpenReceivePo(po)}
                                        sx={{
                                          borderRadius: "8px",
                                          textTransform: "none",
                                          fontWeight: 600,
                                        }}
                                      >
                                        Receive
                                      </Button>
                                    )}
                                  </Box>
                                </Box>
                                <TableContainer
                                  sx={[
                                    {
                                      borderRadius: "10px",
                                      overflowX: "auto",
                                      WebkitOverflowScrolling: "touch",
                                    },
                                    stackedTableSx,
                                    // Nested inside the PO card, so its line cards use the
                                    // page tint instead of a second layer of white.
                                    {
                                      [PHONE]: {
                                        "& tbody tr": { bgcolor: "#F8FAFC" },
                                      },
                                    },
                                  ]}
                                >
                                  <Table size="small">
                                    <TableHead>
                                      <TableRow sx={TABLE_HEAD_ROW_SX}>
                                        <TableCell>Product</TableCell>
                                        <TableCell align="right">
                                          Ordered
                                        </TableCell>
                                        <TableCell align="right">
                                          Received
                                        </TableCell>
                                        <TableCell align="right">
                                          Unit Price
                                        </TableCell>
                                        <TableCell align="right">
                                          Line Total
                                        </TableCell>
                                        <TableCell align="right">Tax</TableCell>
                                        <TableCell align="right">
                                          Total
                                        </TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {po.lines.map((line) => (
                                        <TableRow
                                          key={line.id}
                                          sx={tableRowSx()}
                                        >
                                          <TableCell>
                                            {line.productName}
                                          </TableCell>
                                          <TableCell
                                            align="right"
                                            data-label="Ordered"
                                            data-span="third"
                                          >
                                            {line.orderQuantity}
                                          </TableCell>
                                          <TableCell
                                            align="right"
                                            data-label="Received"
                                            data-span="third"
                                          >
                                            {line.receivedQuantity}
                                          </TableCell>
                                          <TableCell
                                            align="right"
                                            data-label="Unit Price"
                                            data-span="third"
                                          >
                                            {line.unitPrice.toFixed(2)}
                                          </TableCell>
                                          <TableCell
                                            align="right"
                                            data-label="Line Total"
                                            data-span="third"
                                          >
                                            {line.lineTotal.toFixed(2)}
                                          </TableCell>
                                          <TableCell
                                            align="right"
                                            data-label="Tax"
                                            data-span="third"
                                          >
                                            {line.taxAmount > 0
                                              ? `${line.taxAmount.toFixed(2)} (${line.taxPercentage}%)`
                                              : "—"}
                                          </TableCell>
                                          <TableCell
                                            align="right"
                                            data-label="Total"
                                            data-span="third"
                                            sx={{ fontWeight: 600 }}
                                          >
                                            {(
                                              line.lineTotal + line.taxAmount
                                            ).toFixed(2)}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </TableContainer>
                                <Box
                                  sx={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    justifyContent: "flex-end",
                                    columnGap: 0.5,
                                    mt: 1,
                                  }}
                                >
                                  <Typography
                                    sx={{ fontSize: 13, color: "#64748B" }}
                                  >
                                    Sub Total {po.subTotal.toFixed(2)}{" "}
                                    &nbsp;·&nbsp; Tax {po.taxAmount.toFixed(2)}
                                    {/* trailing separator would dangle at a line end once Grand Total wraps below */}
                                    <Box
                                      component="span"
                                      sx={{
                                        display: { xs: "none", sm: "inline" },
                                      }}
                                    >
                                      &nbsp;·&nbsp;
                                    </Box>{" "}
                                  </Typography>
                                  <Typography
                                    sx={{ fontSize: 13, fontWeight: 700 }}
                                  >
                                    Grand Total {po.grandTotal.toFixed(2)}
                                  </Typography>
                                </Box>
                              </Paper>
                            );
                          })}
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
              )}

              {activeTab === "initiate_production" && (
                <Box>
                  {record.status === "In Progress" ||
                  record.status === "Completed" ? (
                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 3 }}
                    >
                      {/* Outer container with soft light-blue glow */}
                      <Paper
                        elevation={0}
                        variant="outlined"
                        sx={{
                          position: "relative",
                          p: { xs: 1.5, sm: 2.5 },
                          borderRadius: "18px",
                          borderColor: "rgba(37, 99, 235, 0.18)",
                          boxShadow: "0 8px 30px rgba(37, 99, 235, 0.12)",
                          overflow: "hidden",
                        }}
                      >
                        {/* Dimmed/muted card grid so stamp pops without losing legibility.
                            Two columns on phones (was one) keeps six cards from becoming a
                            tall column the stamp then has to straddle. */}
                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: {
                              xs: "repeat(2, minmax(0, 1fr))",
                              sm: "repeat(3, minmax(0, 1fr))",
                            },
                            gap: { xs: 1.25, sm: 2 },
                            opacity: 0.78,
                            filter: "contrast(0.95)",
                            "& .MuiPaper-root": {
                              bgcolor: "rgba(255,255,255,0.5)",
                              borderColor: "rgba(148,163,184,0.25)",
                            },
                          }}
                        >
                          <InfoCard label="MRP ID" value={mrpRecord?.mrpId} />
                          <InfoCard
                            label="Production Target ID"
                            value={record.productionTargetId}
                          />
                          <InfoCard
                            label="Start Date"
                            value={record.startDate}
                          />
                          <InfoCard label="End Date" value={record.endDate} />
                          <InfoCard
                            label="Assigned To"
                            value={record.assignedTo}
                          />
                          <InfoCard
                            label="Target Status"
                            valueNode={<StatusChip value={record.status} />}
                          />
                        </Box>

                        {/* Bright, high-contrast, perfectly centered stamp */}
                        <StatusStamp
                          text={
                            record.status === "Completed"
                              ? "Production Completed"
                              : "Production Started"
                          }
                          color={
                            record.status === "Completed"
                              ? "#059669"
                              : "#2563eb"
                          }
                        />
                      </Paper>

                      {(data.mrpDetails?.finishedGoods?.length ?? 0) > 0 && (
                        <Box>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mb: 1.25,
                            }}
                          >
                            <Inventory2OutlinedIcon
                              sx={{ color: "#2563eb", fontSize: 19 }}
                            />
                            <Typography
                              sx={{
                                fontWeight: 700,
                                fontSize: 15,
                                color: "#0F172A",
                              }}
                            >
                              Finished Goods
                            </Typography>
                          </Box>
                          <TableContainer
                            component={Paper}
                            variant="outlined"
                            sx={TABLE_CONTAINER_SX}
                          >
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={TABLE_HEAD_ROW_SX}>
                                  <TableCell>Item</TableCell>
                                  <TableCell>UOM</TableCell>
                                  <TableCell align="right">
                                    Target Quantity
                                  </TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {data.mrpDetails!.finishedGoods.map((fg) => (
                                  <TableRow key={fg.id} sx={tableRowSx()}>
                                    <TableCell>{fg.itemName}</TableCell>
                                    <TableCell>{fg.uomName}</TableCell>
                                    <TableCell align="right">
                                      {fg.targetQuantity}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Box>
                      )}

                      {batchAllocations.length > 0 && (
                        <BatchAllocationSummary
                          allocations={batchAllocations}
                          rawMaterials={data.mrpDetails?.rawMaterials || []}
                          productionTarget={data.record}
                          mrpRecord={data.mrpRecord}
                          finishedGoods={data.mrpDetails?.finishedGoods || []}
                        />
                      )}
                    </Box>
                  ) : !mrpRecord ? (
                    <CenteredStateCard
                      icon={<AssignmentTurnedInIcon sx={{ fontSize: 28 }} />}
                      title="MRP Not Created Yet"
                      description="Create the Material Requirement & Planning first before initiating production."
                    />
                  ) : isProcurementRequired(record.status) ? (
                    <CenteredStateCard
                      icon={<ShoppingCartOutlinedIcon sx={{ fontSize: 28 }} />}
                      iconBg="#FEF3C7"
                      iconColor="#D97706"
                      title="Procurement Required"
                      description="Procurement must be completed before production can start."
                    />
                  ) : (
                    <CenteredStateCard
                      icon={<PlayCircleIcon sx={{ fontSize: 28 }} />}
                      title="Ready to Initiate Production"
                      description="Materials are verified and available. Click below to schedule dates, assign personnel, and launch the production run."
                      action={
                        <Button
                          variant="contained"
                          size="medium"
                          startIcon={<PlayCircleIcon />}
                          onClick={handleOpenInitiateProduction}
                          sx={{
                            borderRadius: "10px",
                            textTransform: "none",
                            fontWeight: 600,
                            px: 2.5,
                            py: 1,
                            boxShadow: "0 4px 12px rgba(37, 99, 235, 0.2)",
                          }}
                        >
                          Allocate Batch &amp; Start Production
                        </Button>
                      }
                    />
                  )}
                </Box>
              )}

              {activeTab === "in_progress" && (
                <Box>
                  {record.status === "In Progress" ? (
                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 3 }}
                    >
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: {
                            xs: "repeat(2, minmax(0, 1fr))",
                            sm: "repeat(3, minmax(0, 1fr))",
                          },
                          gap: { xs: 1.5, sm: 2 },
                        }}
                      >
                        <InfoCard
                          label="Production Target ID"
                          value={record.productionTargetId}
                        />
                        <InfoCard label="Start Date" value={record.startDate} />
                        <InfoCard label="End Date" value={record.endDate} />
                        <InfoCard
                          label="Assigned To"
                          value={record.assignedTo}
                        />
                        <InfoCard
                          label="Status"
                          valueNode={<StatusChip value={record.status} />}
                        />
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          pt: 1,
                        }}
                      >
                        <Button
                          variant="contained"
                          color="success"
                          size="large"
                          startIcon={<TaskAltIcon />}
                          onClick={handleOpenCompleteProduction}
                          sx={{
                            width: { xs: "100%", sm: "auto" },
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
                      <Paper
                        key={entry.id}
                        variant="outlined"
                        sx={{
                          borderRadius: "14px",
                          overflow: "hidden",
                          borderColor: "rgba(148,163,184,0.25)",
                          boxShadow: "0 6px 22px rgba(15, 23, 42, 0.05)",
                        }}
                      >
                        <Box
                          sx={{
                            px: { xs: 1.75, sm: 2.5 },
                            py: 1.75,
                            bgcolor: "#ECFDF5",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: 1,
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1.5,
                            }}
                          >
                            <TaskAltIcon sx={{ color: "#059669" }} />
                            <Box>
                              <Typography sx={{ fontWeight: 700 }}>
                                {entry.consumptionId}
                              </Typography>
                              <Typography
                                sx={{ fontSize: 12, color: "#64748B" }}
                              >
                                {entry.date}
                              </Typography>
                            </Box>
                          </Box>
                          {entry.remarks && (
                            <Typography
                              sx={{
                                fontSize: 13,
                                color: "#475569",
                                fontStyle: "italic",
                              }}
                            >
                              "{entry.remarks}"
                            </Typography>
                          )}
                        </Box>

                        <Box
                          sx={{
                            p: { xs: 1.25, sm: 2 },
                            display: "flex",
                            flexDirection: "column",
                            gap: 2.5,
                          }}
                        >
                          {entry.finishedGoods.length > 0 && (
                            <Box>
                              <Typography
                                sx={{ fontWeight: 700, fontSize: 13, mb: 1 }}
                              >
                                Finished Goods
                              </Typography>
                              <TableContainer
                                component={Paper}
                                variant="outlined"
                                sx={[TABLE_CONTAINER_SX, stackedTableSx]}
                              >
                                <Table size="small">
                                  <TableHead>
                                    <TableRow sx={TABLE_HEAD_ROW_SX}>
                                      <TableCell>Item</TableCell>
                                      <TableCell align="right">
                                        Target
                                      </TableCell>
                                      <TableCell align="right">
                                        Produced
                                      </TableCell>
                                      <TableCell align="right">Scrap</TableCell>
                                      <TableCell>Batch No</TableCell>
                                      <TableCell>Expiry</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {entry.finishedGoods.map((fg) => (
                                      <TableRow key={fg.id} sx={tableRowSx()}>
                                        <TableCell>{fg.itemName}</TableCell>
                                        <TableCell
                                          align="right"
                                          data-label="Target"
                                          data-span="third"
                                        >
                                          {fg.targetQuantity}
                                        </TableCell>
                                        <TableCell
                                          align="right"
                                          data-label="Produced"
                                          data-span="third"
                                        >
                                          {fg.producedQuantity}
                                        </TableCell>
                                        <TableCell
                                          align="right"
                                          data-label="Scrap"
                                          data-span="third"
                                        >
                                          {fg.scrapQuantity}
                                        </TableCell>
                                        <TableCell data-label="Batch No">
                                          {fg.batchNo || "—"}
                                        </TableCell>
                                        <TableCell data-label="Expiry">
                                          {fg.expiryDate || "—"}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            </Box>
                          )}

                          {entry.rawMaterials.length > 0 && (
                            <Box>
                              <Typography
                                sx={{ fontWeight: 700, fontSize: 13, mb: 1 }}
                              >
                                Raw Materials Consumed
                              </Typography>
                              <TableContainer
                                component={Paper}
                                variant="outlined"
                                sx={[TABLE_CONTAINER_SX, stackedTableSx]}
                              >
                                <Table size="small">
                                  <TableHead>
                                    <TableRow sx={TABLE_HEAD_ROW_SX}>
                                      <TableCell>Raw Material</TableCell>
                                      <TableCell>UOM</TableCell>
                                      <TableCell align="right">
                                        Allocated
                                      </TableCell>
                                      <TableCell align="right">
                                        Consumed
                                      </TableCell>
                                      <TableCell align="right">Scrap</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {entry.rawMaterials.map((rm) => (
                                      <TableRow key={rm.id} sx={tableRowSx()}>
                                        <TableCell>{rm.productName}</TableCell>
                                        <TableCell data-label="UOM">
                                          {rm.uom}
                                        </TableCell>
                                        <TableCell
                                          align="right"
                                          data-label="Allocated"
                                        >
                                          {rm.allocatedQuantity}
                                        </TableCell>
                                        <TableCell
                                          align="right"
                                          data-label="Consumed"
                                        >
                                          {rm.consumedQuantity}
                                        </TableCell>
                                        <TableCell
                                          align="right"
                                          data-label="Scrap"
                                        >
                                          {rm.scrapQuantity}
                                        </TableCell>
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

      <Suspense fallback={null}>
        {mrpDialogOpen && (
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
        )}

        {poDialogOpen && (
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
        )}

        {consumptionDialogOpen && (
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
        )}

        {createPoDialogOpen && (
          <CreatePoDialog
            open={createPoDialogOpen}
            draft={createPoDraft}
            draftError={createPoDraftError}
            committing={createPoCommitting}
            commitError={createPoCommitError}
            suppliers={suppliers}
            paymentTerms={paymentTerms}
            taxTypes={taxTypes}
            onDraftChange={setCreatePoDraft}
            onCancel={handleCancelCreatePoDraft}
            onConfirm={handleConfirmCreatePo}
          />
        )}

        {receivePoDialogOpen && (
          <ReceivePoDialog
            open={receivePoDialogOpen}
            poNumber={receivingPo?.poNumber || ""}
            draft={receivePoDraft}
            draftError={receivePoDraftError}
            committing={receivePoCommitting}
            commitError={receivePoCommitError}
            onDraftChange={setReceivePoDraft}
            onCancel={handleCancelReceivePoDraft}
            onConfirm={handleConfirmReceivePo}
          />
        )}
      </Suspense>

      <Dialog
        open={stockStillShortOpen}
        onClose={() => setStockStillShortOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "22px",
            overflow: "hidden",
            boxShadow: "0 24px 60px rgba(15, 23, 42, 0.22)",
            border: "1px solid rgba(255, 255, 255, 0.9)",
            bgcolor: "#fff",
            // A short prompt: stay a card on phones, but claim the width the
            // default 32px side margins waste.
            [PHONE]: {
              m: 2,
              width: "calc(100% - 32px)",
              maxHeight: "calc(100% - 32px)",
            },
          },
        }}
      >
        <Box
          sx={{
            background:
              "linear-gradient(135deg, #7c2d12 0%, #c2410c 45%, #ea580c 100%)",
            color: "#fff",
            px: { xs: 2, sm: 3 },
            py: 2.25,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: { xs: 1.25, sm: 1.75 },
              minWidth: 0,
            }}
          >
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: "12px",
                bgcolor: "rgba(255, 255, 255, 0.18)",
                backdropFilter: "blur(8px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(255, 255, 255, 0.28)",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.12)",
                flexShrink: 0,
              }}
            >
              <WarningAmberRoundedIcon sx={{ fontSize: 26, color: "#fff" }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                  columnGap: 1,
                  rowGap: 0.5,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    lineHeight: 1.2,
                    fontSize: 18,
                    color: "#fff",
                  }}
                >
                  Stock Still Short
                </Typography>
                <Chip
                  size="small"
                  label={`${stockShortItems.length} item${stockShortItems.length === 1 ? "" : "s"}`}
                  sx={{
                    bgcolor: "rgba(255, 255, 255, 0.22)",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 11,
                    height: 20,
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                  }}
                />
              </Box>
              <Typography
                variant="body2"
                sx={{
                  color: "rgba(255,255,255,0.88)",
                  fontSize: 12.5,
                  mt: 0.25,
                }}
              >
                Insufficient raw material inventory in warehouse
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={() => setStockStillShortOpen(false)}
            sx={{
              flexShrink: 0,
              color: "rgba(255,255,255,0.85)",
              "&:hover": { color: "#fff", bgcolor: "rgba(255,255,255,0.15)" },
            }}
            aria-label="Close"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: { xs: 2, sm: 3 }, bgcolor: "#F8FAFC" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: 1.5,
              p: 1.75,
              mb: 2.5,
              borderRadius: "14px",
              bgcolor: "#FFFBEB",
              border: "1px solid #FDE68A",
            }}
          >
            <InfoOutlinedIcon
              sx={{ color: "#D97706", fontSize: 20, mt: 0.2, flexShrink: 0 }}
            />
            <Typography
              sx={{
                fontSize: 13,
                color: "#92400E",
                lineHeight: 1.55,
                fontWeight: 500,
              }}
            >
              Available stock is not sufficient yet to cover the raw materials
              below. Please complete the purchase for the pending quantity, then
              check stock again once received.
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 1.25,
              px: 0.5,
            }}
          >
            <Typography
              sx={{
                fontSize: 11.5,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "#64748B",
              }}
            >
              Shortfall Raw Materials ({stockShortItems.length})
            </Typography>
            <Typography
              sx={{ fontSize: 11.5, fontWeight: 600, color: "#DC2626" }}
            >
              Still Needed
            </Typography>
          </Box>

          <Box
            sx={{
              maxHeight: { xs: "min(280px, 38vh)", sm: 280 },
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
              display: "flex",
              flexDirection: "column",
              gap: 1,
              pr: 0.5,
              "&::-webkit-scrollbar": { width: "5px" },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "rgba(148, 163, 184, 0.35)",
                borderRadius: "999px",
              },
            }}
          >
            {stockShortItems.map((item) => (
              <Paper
                key={item.id}
                elevation={0}
                sx={{
                  p: 1.5,
                  borderRadius: "12px",
                  bgcolor: "#ffffff",
                  border: "1px solid rgba(226, 232, 240, 0.9)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1.5,
                  transition: "all 150ms ease",
                  [CAN_HOVER]: {
                    "&:hover": {
                      borderColor: "rgba(245, 158, 11, 0.45)",
                      boxShadow: "0 4px 14px rgba(245, 158, 11, 0.08)",
                      transform: "translateY(-1px)",
                    },
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    minWidth: 0,
                  }}
                >
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "10px",
                      bgcolor: "rgba(239, 68, 68, 0.08)",
                      color: "#EF4444",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Inventory2OutlinedIcon sx={{ fontSize: 19 }} />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: 13.5,
                        color: "#0F172A",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={item.productName}
                    >
                      {item.productName}
                    </Typography>
                    <Typography
                      sx={{ fontSize: 11.5, color: "#64748B", mt: 0.2 }}
                    >
                      Required:{" "}
                      {item.stockRequired > 0
                        ? item.stockRequired.toFixed(2)
                        : item.neededQuantity.toFixed(2)}{" "}
                      {item.uomName}
                      {item.stockOnHand > 0
                        ? ` • On Hand: ${item.stockOnHand.toFixed(2)}`
                        : ""}
                    </Typography>
                  </Box>
                </Box>

                <Box
                  sx={{
                    flexShrink: 0,
                    px: 1.5,
                    py: 0.6,
                    borderRadius: "10px",
                    bgcolor: "#FEF2F2",
                    border: "1px solid #FECACA",
                    color: "#DC2626",
                    textAlign: "right",
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 800,
                      fontSize: 13.5,
                      fontVariantNumeric: "tabular-nums",
                      lineHeight: 1.2,
                    }}
                  >
                    {item.neededQuantity.toFixed(2)}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      color: "#DC2626",
                      opacity: 0.85,
                    }}
                  >
                    {item.uomName}
                  </Typography>
                </Box>
              </Paper>
            ))}
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2.25,
            bgcolor: "#F8FAFC",
            borderTop: "1px solid rgba(226, 232, 240, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1.5,
            // Two labelled buttons don't fit side by side in ~300px: stack
            // them full-width with the primary action on top.
            [PHONE]: {
              flexDirection: "column-reverse",
              alignItems: "stretch",
              px: 2,
              "& > :not(:first-of-type)": { ml: 0 },
            },
          }}
        >
          <Button
            onClick={() => setStockStillShortOpen(false)}
            variant="outlined"
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 600,
              px: 2.5,
              color: "#475569",
              borderColor: "rgba(148, 163, 184, 0.35)",
              "&:hover": {
                bgcolor: "rgba(241, 245, 249, 0.8)",
                borderColor: "#94A3B8",
              },
            }}
          >
            Dismiss
          </Button>

          <Button
            onClick={() => {
              setStockStillShortOpen(false);
              setSelectedNonStockItemIds(
                stockShortItems.map((item) => item.id),
              );
              if (activeTab !== "procurement") {
                setActiveTab("procurement");
              }
            }}
            variant="contained"
            startIcon={
              activeTab !== "procurement" ? (
                <ShoppingCartCheckoutIcon sx={{ fontSize: 18 }} />
              ) : (
                <TaskAltIcon sx={{ fontSize: 18 }} />
              )
            }
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 700,
              px: 2.5,
              background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
              boxShadow: "0 4px 14px rgba(37, 99, 235, 0.28)",
              "&:hover": {
                background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
                boxShadow: "0 6px 20px rgba(37, 99, 235, 0.38)",
              },
            }}
          >
            {activeTab !== "procurement"
              ? "Go to Procurement"
              : "Select Shortfall Items"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={postReceiveCheckPromptOpen}
        onClose={handlePostReceiveCheckLater}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "20px",
            overflow: "hidden",
            [PHONE]: { m: 2, width: "calc(100% - 32px)" },
          },
        }}
      >
        <Box
          sx={{
            background:
              "linear-gradient(135deg, #1e3a8a 0%, #2563eb 55%, #0ea5e9 100%)",
            color: "#fff",
            px: 3,
            pt: 3.5,
            pb: 3,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: 1.25,
          }}
        >
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: "16px",
              bgcolor: "rgba(255, 255, 255, 0.18)",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Inventory2OutlinedIcon sx={{ fontSize: 28 }} />
          </Box>
          <Typography sx={{ fontWeight: 800, fontSize: 19 }}>
            All Purchases Received
          </Typography>
          <Typography
            sx={{
              fontSize: 13.5,
              color: "rgba(255,255,255,0.88)",
              lineHeight: 1.5,
            }}
          >
            Every Purchase Order for this Production has now been received.
          </Typography>
        </Box>
        <DialogContent sx={{ px: 3, py: 3, bgcolor: "#F8FAFC" }}>
          <DialogContentText
            sx={{ fontSize: 14, color: "#334155", textAlign: "center" }}
          >
            Check Stock for reserving raw material for this production, or check
            back later once you're ready.
          </DialogContentText>
        </DialogContent>
        <DialogActions
          sx={{
            px: 3,
            pb: 3,
            pt: 0,
            bgcolor: "#F8FAFC",
            gap: 1.25,
            [PHONE]: {
              flexDirection: "column-reverse",
              alignItems: "stretch",
              px: 2.5,
              "& > :not(:first-of-type)": { ml: 0 },
            },
          }}
        >
          <Button
            onClick={handlePostReceiveCheckLater}
            fullWidth
            variant="outlined"
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Check Later
          </Button>
          <Button
            onClick={handlePostReceiveCheckStock}
            fullWidth
            variant="contained"
            startIcon={<Inventory2OutlinedIcon sx={{ fontSize: 18 }} />}
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 700,
              boxShadow: "0 8px 20px rgba(37, 99, 235, 0.28)",
            }}
          >
            Check Stock
          </Button>
        </DialogActions>
      </Dialog>

      <ModernSnackbar
        open={checkStockSuccessOpen}
        onClose={() => setCheckStockSuccessOpen(false)}
        severity="success"
        message="Stock check complete — all raw materials are now available."
      />

      <ModernSnackbar
        open={checkStockWarningOpen}
        onClose={() => setCheckStockWarningOpen(false)}
        severity="warning"
        message="Need to Receive Raw Materials"
      />

      <ModernSnackbar
        open={!!successMessage}
        onClose={() => setSuccessMessage("")}
        severity="success"
        message={successMessage}
      />
    </Box>
  );
}

// ───────────── Batch Allocation Summary ─────────────
// Shown right after "Allocate Batch & Start Production" — groups the
// AllocateAndCommitBatch response by raw material and, under each, chips out
// the specific Batch_Details rows FEFO picked to cover it (a material can
// draw from more than one batch when the oldest alone doesn't cover the
// need). Cross-references rawMaterials for the display name/UOM/needed qty/
// status, since the Custom API's response only carries record IDs.
function BatchAllocationSummary({
  allocations,
  rawMaterials,
  productionTarget,
  mrpRecord,
  finishedGoods,
}: {
  allocations: BatchAllocationLine[];
  rawMaterials: RawMaterialNeedRow[];
  productionTarget: ProductionTargetRow | null;
  mrpRecord: MrpRow | null;
  finishedGoods: FinishedGoodTargetRow[];
}) {
  const [pdfSnackbar, setPdfSnackbar] = useState<{
    message: string;
    severity: "success" | "error" | "info";
    autoHideMs?: number;
  } | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const groups = useMemo(() => {
    // The Custom API's Batch_NO/Product are Deluge's raw 17-digit record IDs,
    // which silently lose precision crossing the JSON boundary to the
    // browser (they exceed Number.MAX_SAFE_INTEGER) — so productId here can
    // never be trusted to line up with a Raw_Materials row's ID. productName
    // (the Deluge function's own Product_Name lookup) doesn't have that
    // problem, so match/group by name first and only fall back to the ID
    // for anyone still on the older, unpatched Deluge function.
    function resolveMaterial(
      line: BatchAllocationLine,
    ): RawMaterialNeedRow | undefined {
      return (
        rawMaterials.find(
          (rm) =>
            rm.productName &&
            line.productName &&
            rm.productName.trim().toLowerCase() ===
              line.productName.trim().toLowerCase(),
        ) ||
        rawMaterials.find(
          (rm) => rm.productId && rm.productId === line.productId,
        )
      );
    }

    const byGroupKey = new Map<
      string,
      {
        lines: BatchAllocationLine[];
        material?: RawMaterialNeedRow;
        fallbackName?: string;
      }
    >();
    allocations.forEach((line) => {
      const material = resolveMaterial(line);
      const key =
        material?.productName?.trim().toLowerCase() ||
        line.productName?.trim().toLowerCase() ||
        material?.productId ||
        line.productId ||
        "unknown";
      const group = byGroupKey.get(key) || {
        lines: [],
        material,
        fallbackName: line.productName,
      };
      group.lines.push(line);
      if (!group.material && material) group.material = material;
      byGroupKey.set(key, group);
    });
    return Array.from(byGroupKey.entries()).map(([key, group]) => ({
      key,
      ...group,
    }));
  }, [allocations, rawMaterials]);

  if (groups.length === 0) return null;

  function handleDownloadPdf() {
    if (!productionTarget || isDownloadingPdf) return;
    setIsDownloadingPdf(true);
    // Loaded on demand — jsPDF + autoTable are only needed by the handful
    // of users who actually click this, so keep them out of everyone
    // else's initial bundle (same reasoning as the lazy dialogs above).
    import("../utils/batchAllocationPdf")
      .then(function (mod) {
        return mod.downloadBatchAllocationPdf({
          productionTarget,
          mrpRecord,
          groups,
          finishedGoods,
        });
      })
      .then(function (delivery) {
        if (delivery === "cancelled") return;
        if (delivery === "shared") {
          setPdfSnackbar({
            message: "Batch allocation PDF is ready.",
            severity: "success",
          });
          return;
        }
        // A plain download can't be confirmed from inside a mobile webview
        // (the host app may ignore it), so don't claim success there.
        if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
          setPdfSnackbar({
            message:
              "PDF requested. If nothing was saved, open this page in your phone's browser (e.g. Chrome) and download it from there.",
            severity: "info",
            autoHideMs: 9000,
          });
          return;
        }
        setPdfSnackbar({
          message: "Batch allocation PDF is Downloading.",
          severity: "success",
        });
      })
      .catch(function () {
        setPdfSnackbar({
          message:
            "Couldn't create the batch allocation PDF. Please try again.",
          severity: "error",
        });
      })
      .finally(function () {
        setIsDownloadingPdf(false);
      });
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 2, sm: 2.5 },
        borderRadius: "18px",
        bgcolor: "rgba(255,255,255,0.70)",
        backdropFilter: "blur(14px)",
        border: "1px solid rgba(226, 232, 240, 0.8)",
        boxShadow: "0 8px 24px rgba(30, 58, 138, 0.05)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 2 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: "11px",
            background:
              "linear-gradient(135deg, rgba(37,99,235,0.15) 0%, rgba(37,99,235,0.06) 100%)",
            color: "#2563eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 2px 8px rgba(37, 99, 235, 0.15)",
            border: "1px solid rgba(37, 99, 235, 0.20)",
          }}
        >
          <Inventory2OutlinedIcon sx={{ fontSize: 20 }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{ fontWeight: 800, fontSize: 15.5, color: "#0F172A" }}
          >
            Batch Allocation
          </Typography>
          <Typography sx={{ fontSize: 12, color: "#64748B", fontWeight: 500 }}>
            FEFO-picked batches committed for this production run
          </Typography>
        </Box>
        <Tooltip title="Download batch allocation report (PDF)">
          <span>
            <IconButton
              onClick={handleDownloadPdf}
              disabled={!productionTarget || isDownloadingPdf}
              size="small"
              aria-label="Download batch allocation PDF"
              aria-busy={isDownloadingPdf}
              sx={{
                borderRadius: "10px",
                color: "#2563eb",
                bgcolor: "rgba(37, 99, 235, 0.08)",
                border: "1px solid rgba(37, 99, 235, 0.20)",
                // 34px by default — bump to a proper touch target on phones.
                [PHONE]: { width: 42, height: 42 },
                "&:hover": { bgcolor: "rgba(37, 99, 235, 0.16)" },
              }}
            >
              {isDownloadingPdf ? (
                <CircularProgress size={19} color="inherit" />
              ) : (
                <DownloadIcon sx={{ fontSize: 19 }} />
              )}
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {groups.map((group) => (
          <BatchAllocationGroupRow
            key={group.key}
            material={group.material}
            fallbackName={group.fallbackName}
            lines={group.lines}
          />
        ))}
      </Box>

      <ModernSnackbar
        open={!!pdfSnackbar}
        onClose={() => setPdfSnackbar(null)}
        severity={pdfSnackbar?.severity || "success"}
        message={pdfSnackbar?.message || ""}
        autoHideDuration={pdfSnackbar?.autoHideMs}
      />
    </Paper>
  );
}

function BatchAllocationGroupRow({
  material,
  fallbackName,
  lines,
}: {
  material?: RawMaterialNeedRow;
  fallbackName?: string;
  lines: BatchAllocationLine[];
}) {
  const totalAllocated = lines.reduce(
    (sum, line) => sum + (line.batchQty || 0),
    0,
  );

  return (
    <Box
      sx={{
        borderRadius: "14px",
        border: "1px solid rgba(226, 232, 240, 0.8)",
        bgcolor: "rgba(248,250,252,0.75)",
        backdropFilter: "blur(8px)",
        p: { xs: 1.5, sm: 1.85 },
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        [CAN_HOVER]: {
          "&:hover": {
            boxShadow: "0 8px 24px rgba(37, 99, 235, 0.08)",
            borderColor: "rgba(37, 99, 235, 0.3)",
            bgcolor: "rgba(255, 255, 255, 0.95)",
            transform: "translateY(-1px)",
          },
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          mb: 1.25,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 14, color: "#0F172A" }}>
            {material?.productName || fallbackName || "—"}
          </Typography>
          <Typography
            sx={{ fontSize: 12, color: "#64748B", mt: 0.25, fontWeight: 500 }}
          >
            {material?.uom ? `${material.uom} · ` : ""}
            Stock Required: {material ? material.stockRequired : totalAllocated}
          </Typography>
        </Box>
        {material?.status && <StatusChip value={material.status} />}
      </Box>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        {lines.map((line, idx) => (
          <BatchChip key={line.batchId || idx} line={line} />
        ))}
      </Box>
    </Box>
  );
}

function BatchChip({ line }: { line: BatchAllocationLine }) {
  const label =
    line.batchNumber ||
    (line.batchId ? `Batch #${line.batchId.slice(-6)}` : "Batch");
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        pl: 1.3,
        pr: 1.6,
        py: 0.6,
        borderRadius: "10px",
        bgcolor: "rgba(37, 99, 235, 0.06)",
        border: "1px solid rgba(37, 99, 235, 0.20)",
        backdropFilter: "blur(6px)",
        transition: "all 0.2s ease",
        [CAN_HOVER]: {
          "&:hover": {
            bgcolor: "rgba(37, 99, 235, 0.10)",
            borderColor: "rgba(37, 99, 235, 0.35)",
            transform: "translateY(-1px)",
          },
        },
      }}
    >
      <Box
        sx={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          bgcolor: "#2563eb",
          flexShrink: 0,
          boxShadow: "0 0 4px rgba(37, 99, 235, 0.5)",
        }}
      />
      <Box sx={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
        <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#1D4ED8" }}>
          {label}
          <Box
            component="span"
            sx={{ color: "#0F172A", fontWeight: 600, ml: 0.6 }}
          >
            ({line.batchQty})
          </Box>
        </Typography>
        {line.expiryDate && (
          <Typography sx={{ fontSize: 10, color: "#64748B", fontWeight: 500 }}>
            Exp {line.expiryDate}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

function InfoCard({
  label,
  value,
  valueNode,
  wideOnPhone = false,
}: {
  label: string;
  value?: string;
  valueNode?: React.ReactNode;
  // Span both columns of the phone's two-column grid — for long values and
  // status chips, which don't fit in a half-width card.
  wideOnPhone?: boolean;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 1.5, sm: 2.25 },
        minWidth: 0,
        gridColumn: wideOnPhone ? { xs: "1 / -1", sm: "auto" } : undefined,
        borderRadius: "16px",
        bgcolor: "rgba(255,255,255,0.75)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(226, 232, 240, 0.8)",
        boxShadow: "0 4px 16px rgba(15, 23, 42, 0.03)",
        transition: "all 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
        position: "relative",
        overflow: "hidden",
        [CAN_HOVER]: {
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 12px 30px rgba(37, 99, 235, 0.12)",
            borderColor: "rgba(37, 99, 235, 0.35)",
          },
        },
      }}
    >
      <Typography
        sx={{
          fontSize: 11.5,
          fontWeight: 600,
          color: "#64748B",
          mb: 0.75,
          letterSpacing: "0.02em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </Typography>
      {valueNode || (
        <Typography
          sx={{
            fontWeight: 800,
            fontSize: { xs: 14, sm: 15 },
            color: "#0F172A",
            wordBreak: "break-word",
          }}
        >
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
  iconBg = "rgba(37, 99, 235, 0.10)",
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
        p: { xs: 2.5, sm: 4.5 },
        borderRadius: "20px",
        textAlign: "center",
        bgcolor: "rgba(255,255,255,0.60)",
        borderStyle: "dashed",
        borderWidth: 2,
        borderColor: "rgba(148,163,184,0.35)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        boxShadow: "0 8px 24px rgba(15, 23, 42, 0.03)",
        transition: "all 0.25s ease",
        [CAN_HOVER]: {
          "&:hover": {
            borderColor: "rgba(37,99,235,0.45)",
            bgcolor: "rgba(255,255,255,0.80)",
            boxShadow: "0 12px 32px rgba(37, 99, 235, 0.08)",
          },
        },
      }}
    >
      <Box
        sx={{
          width: 58,
          height: 58,
          borderRadius: "16px",
          bgcolor: iconBg,
          color: iconColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 4px 16px ${iconColor}25`,
          border: `1px solid ${iconColor}30`,
          transition: "transform 0.25s ease",
          [CAN_HOVER]: {
            "&:hover": {
              transform: "scale(1.08)",
            },
          },
        }}
      >
        {icon}
      </Box>
      <Box sx={{ maxWidth: 500 }}>
        <Typography
          sx={{ fontWeight: 800, fontSize: 17, color: "#0F172A", mb: 0.75 }}
        >
          {title}
        </Typography>
        {description && (
          <Typography
            sx={{ fontSize: 13.5, color: "#64748B", lineHeight: 1.6 }}
          >
            {description}
          </Typography>
        )}
      </Box>
      {/* Primary action spans the card on phones — long labels such as
          "Allocate Batch & Start Production" otherwise wrap inside a
          shrink-wrapped button. */}
      {action && (
        <Box
          sx={{
            width: { xs: "100%", sm: "auto" },
            "& > .MuiButton-root": { width: { xs: "100%", sm: "auto" } },
          }}
        >
          {action}
        </Box>
      )}
    </Paper>
  );
}

// A classic rotated "ink stamp" overlay — sits on top of whatever's behind
// it (pointer-events disabled). Centered vertically and horizontally over the
// parent container without being affected by child opacity.
function StatusStamp({
  text,
  color = "#2563eb",
}: {
  text: string;
  color?: string;
}) {
  const isCompleted = color === "#059669" || color === "#10b981";
  return (
    <Box
      aria-hidden
      sx={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transformOrigin: "center center",
        pointerEvents: "none",
        zIndex: 2,
        userSelect: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation:
          "stampPop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
      }}
    >
      <Box
        sx={{
          position: "relative",
          border: `3px solid ${color}`,
          borderRadius: "12px",
          color: color,
          bgcolor: "rgba(255, 255, 255, 0.88)",
          backdropFilter: "blur(12px)",
          boxShadow: isCompleted
            ? "0 8px 30px rgba(16, 185, 129, 0.3), 0 0 0 2px rgba(255,255,255,0.8)"
            : "0 8px 30px rgba(37, 99, 235, 0.3), 0 0 0 2px rgba(255,255,255,0.8)",
          fontWeight: 900,
          fontSize: { xs: 15, sm: 22, md: 24 },
          letterSpacing: { xs: "0.1em", sm: "0.14em" },
          textTransform: "uppercase",
          px: { xs: 2, sm: 4 },
          py: { xs: 0.85, sm: 1.3 },
          opacity: 0.96,
          // Wraps to two centred lines on phones ("PRODUCTION / COMPLETED")
          // instead of running ~300px wide and being clipped by the card.
          whiteSpace: { xs: "normal", sm: "nowrap" },
          textAlign: "center",
          lineHeight: 1.25,
          width: { xs: "max-content", sm: "auto" },
          maxWidth: { xs: 210, sm: "none" },
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 4,
            border: `1.5px dashed ${color}`,
            borderRadius: "7px",
            opacity: 0.75,
          },
        }}
      >
        {text}
      </Box>
    </Box>
  );
}

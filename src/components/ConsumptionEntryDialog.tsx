import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import FoodProductionLoader from "./FoodProductionLoader";
import { generateNextBatchNumber } from "../services/productionApi";
import {
  fullScreenDialogActionsSx,
  fullScreenDialogPaperSx,
  stackedTableSx,
} from "./common/responsive";
import type {
  ConsumptionEntryDraft,
  ConsumptionFinishedGoodDraftRow,
  ConsumptionRawMaterialDraftRow,
} from "../types";

interface ConsumptionEntryDialogProps {
  open: boolean;
  draft: ConsumptionEntryDraft | null;
  draftError: string;
  committing: boolean;
  commitError: string;
  onDraftChange: (draft: ConsumptionEntryDraft) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConsumptionEntryDialog({
  open,
  draft,
  draftError,
  committing,
  commitError,
  onDraftChange,
  onCancel,
  onConfirm,
}: ConsumptionEntryDialogProps) {
  const isPreparing = !draft && !draftError;
  const today = new Date().toISOString().slice(0, 10);
  const [generatingBatchIndex, setGeneratingBatchIndex] = useState<number | null>(null);

  // Subtracting two decimals in JS routinely lands on IEEE754 noise (e.g.
  // 2 - 1.8 === 0.19999999999999996), which has far more digits once sent
  // to Zoho than a decimal field allows — Creator rejects it outright with
  // "<Field> has exceeded its maximum digits" (code 3001). Same fix as
  // productionApi.ts's roundQty, just local here since this is a
  // presentation-only dialog that doesn't import the service layer.
  function roundQty(value: number): number {
    if (!isFinite(value)) return 0;
    return Math.round((value + Number.EPSILON) * 10000) / 10000;
  }
  // Batch_No, MFD_Date and Expiry_Date are all mandatory on
  // Finished_Goods_Cunsumptions now (MFD_Date and Expiry_Date are "must
  // have" fields on the form) — block submit until every finished good has
  // all three.
  const areFinishedGoodsValid =
    !!draft &&
    draft.finishedGoods.length > 0 &&
    draft.finishedGoods.every(
      (fg) =>
        typeof fg.batchNo === "string" &&
        fg.batchNo.trim().length > 0 &&
        !!fg.manufacturingDate &&
        !!fg.expiryDate &&
        fg.manufacturingDate <= fg.expiryDate
    );

  function updateFinishedGood(index: number, patch: Partial<ConsumptionFinishedGoodDraftRow>) {
    if (!draft) return;
    const rows = draft.finishedGoods.slice();
    const row = { ...rows[index], ...patch };
    if (patch.producedQuantity !== undefined) {
      let produced = patch.producedQuantity;
      if (isNaN(produced) || produced < 0) produced = 0;
      if (produced > row.targetQuantity) produced = row.targetQuantity;
      row.producedQuantity = produced;
      row.scrapQuantity = roundQty(Math.max(0, row.targetQuantity - produced));
    }
    rows[index] = row;
    onDraftChange({ ...draft, finishedGoods: rows });
  }

  function handleGenerateBatchNo(index: number) {
    if (generatingBatchIndex !== null) return;
    setGeneratingBatchIndex(index);
    generateNextBatchNumber()
      .then(function (batchNo) {
        updateFinishedGood(index, { batchNo });
      })
      .catch(function () {
        // Best-effort — leave the field as-is so the user can still type one manually.
      })
      .finally(function () {
        setGeneratingBatchIndex(null);
      });
  }

  function updateRawMaterial(index: number, patch: Partial<ConsumptionRawMaterialDraftRow>) {
    if (!draft) return;
    const rows = draft.rawMaterials.slice();
    const row = { ...rows[index], ...patch };
    if (patch.consumedQuantity !== undefined) {
      let consumed = patch.consumedQuantity;
      if (isNaN(consumed) || consumed < 0) consumed = 0;
      if (consumed > row.allocatedQuantity) consumed = row.allocatedQuantity;
      row.consumedQuantity = consumed;
      row.scrapQuantity = roundQty(Math.max(0, row.allocatedQuantity - consumed));
    }
    rows[index] = row;
    onDraftChange({ ...draft, rawMaterials: rows });
  }

  return (
    <Dialog
      open={open}
      onClose={committing ? undefined : onCancel}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: "22px",
          overflow: "hidden",
          boxShadow: "0 24px 60px rgba(15, 23, 42, 0.22)",
          ...fullScreenDialogPaperSx,
        },
      }}
    >
      <Box
        sx={{
          background: "linear-gradient(135deg, #064e3b 0%, #059669 50%, #10b981 100%)",
          color: "#fff",
          px: { xs: 2, sm: 3 },
          py: { xs: 1.75, sm: 2.5 },
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1.25, sm: 1.5 }, minWidth: 0 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              flexShrink: 0,
              borderRadius: "10px",
              bgcolor: "rgba(255, 255, 255, 0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(8px)",
            }}
          >
            <TaskAltIcon sx={{ fontSize: 22 }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2, fontSize: { xs: 16, sm: 17 } }}>
              Complete Production
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)", fontSize: { xs: 12, sm: 12.5 } }}>
              Log what was produced &amp; consumed, then wrap up this run
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onCancel} disabled={committing} sx={{ color: "#fff", flexShrink: 0 }} aria-label="Close">
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: { xs: 2, sm: 3 }, bgcolor: "#F8FAFC" }}>
        {isPreparing && (
          <FoodProductionLoader
            size="medium"
            text="Fetching Production Target details…"
            subtext="Loading finished goods and allocated raw materials for this run"
          />
        )}

        {draftError && (
          <Alert severity="error" sx={{ borderRadius: "12px" }}>
            {draftError}
          </Alert>
        )}

        {draft && (
          <>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2, mb: 2.5 }}>
              <FieldCard label="Consumption ID" value={draft.consumptionId} />
              <FieldCard label="Production Target" value={draft.productionTargetId} />
              <TextField
                label="Date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={draft.date}
                onChange={(e) => onDraftChange({ ...draft, date: e.target.value })}
                disabled={committing}
                inputProps={{ max: today }}
                sx={{ bgcolor: "#fff", borderRadius: "10px" }}
              />
            </Box>

            <TextField
              label="Remarks"
              placeholder="Optional"
              multiline
              minRows={2}
              fullWidth
              value={draft.remarks}
              onChange={(e) => onDraftChange({ ...draft, remarks: e.target.value })}
              disabled={committing}
              sx={{ mb: 3, bgcolor: "#fff", borderRadius: "10px" }}
            />

            <Typography sx={{ fontWeight: 700, mb: 1 }}>Finished Good Production</Typography>
            <TableContainer component={Paper} variant="outlined" sx={[{ borderRadius: "12px", mb: 2 }, stackedTableSx]}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ "& th": { fontWeight: 700, bgcolor: "#F1F5F9" } }}>
                    <TableCell>Finished Good</TableCell>
                    <TableCell align="right">Target Qty</TableCell>
                    <TableCell align="right" sx={{ minWidth: 120 }}>
                      Produced Qty
                    </TableCell>
                    <TableCell align="right">Scrap Qty</TableCell>
                    <TableCell sx={{ minWidth: 190 }}>
                      Batch No <Box component="span" sx={{ color: "error.main" }}>*</Box>
                    </TableCell>
                    <TableCell sx={{ minWidth: 150 }}>
                      MFD Date <Box component="span" sx={{ color: "error.main" }}>*</Box>
                    </TableCell>
                    <TableCell sx={{ minWidth: 150 }}>
                      Expiry Date <Box component="span" sx={{ color: "error.main" }}>*</Box>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {draft.finishedGoods.map((fg, index) => {
                    const isMissingBatch = !fg.batchNo || !fg.batchNo.trim();
                    const mfdAfterExpiry =
                      !!fg.manufacturingDate && !!fg.expiryDate && fg.manufacturingDate > fg.expiryDate;
                    return (
                      <TableRow key={fg.itemId + index}>
                        <TableCell>
                          {fg.itemName}
                          {fg.uom && (
                            <Typography component="span" sx={{ fontSize: 12, color: "#94A3B8", ml: 0.5 }}>
                              ({fg.uom})
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right" data-label="Target Qty" data-span="third">{fg.targetQuantity}</TableCell>
                        <TableCell align="right" data-label="Produced Qty" data-span="third">
                          <TextField
                            type="number"
                            size="small"
                            value={fg.producedQuantity}
                            disabled={committing}
                            onChange={(e) =>
                              updateFinishedGood(index, { producedQuantity: parseFloat(e.target.value) })
                            }
                            inputProps={{ min: 0, max: fg.targetQuantity, style: { textAlign: "right" } }}
                            sx={{ bgcolor: "#fff", borderRadius: "8px", width: 100 }}
                          />
                        </TableCell>
                        <TableCell align="right" data-label="Scrap Qty" data-span="third" sx={{ color: "#94A3B8" }}>
                          {fg.scrapQuantity.toFixed(2)}
                        </TableCell>
                        <TableCell data-label="Batch No *" data-span="full">
                          <TextField
                            size="small"
                            placeholder="Required *"
                            required
                            error={isMissingBatch}
                            value={fg.batchNo}
                            disabled={committing}
                            onChange={(e) => updateFinishedGood(index, { batchNo: e.target.value })}
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  <Tooltip title={fg.batchNo.trim() ? "Batch number already set" : "Generate batch number"}>
                                    <span>
                                      <IconButton
                                        size="small"
                                        edge="end"
                                        aria-label="Generate batch number"
                                        disabled={committing || generatingBatchIndex !== null || !!fg.batchNo.trim()}
                                        onClick={() => handleGenerateBatchNo(index)}
                                      >
                                        {generatingBatchIndex === index ? (
                                          <CircularProgress size={16} />
                                        ) : (
                                          <AutoAwesomeIcon sx={{ fontSize: 18, color: "#059669" }} />
                                        )}
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                </InputAdornment>
                              ),
                            }}
                            sx={{
                              bgcolor: "#fff",
                              borderRadius: "8px",
                              width: 175,
                              "& .MuiOutlinedInput-root": {
                                borderRadius: "8px",
                              },
                            }}
                          />
                        </TableCell>
                        <TableCell data-label="MFD Date *">
                          <TextField
                            type="date"
                            size="small"
                            InputLabelProps={{ shrink: true }}
                            value={fg.manufacturingDate}
                            disabled={committing}
                            error={mfdAfterExpiry}
                            onChange={(e) => updateFinishedGood(index, { manufacturingDate: e.target.value })}
                            inputProps={{ max: fg.expiryDate || today }}
                            sx={{ bgcolor: "#fff", borderRadius: "8px" }}
                          />
                        </TableCell>
                        <TableCell data-label="Expiry Date *">
                          <TextField
                            type="date"
                            size="small"
                            InputLabelProps={{ shrink: true }}
                            value={fg.expiryDate}
                            disabled={committing}
                            error={mfdAfterExpiry}
                            onChange={(e) => updateFinishedGood(index, { expiryDate: e.target.value })}
                            inputProps={{ min: fg.manufacturingDate || today }}
                            sx={{ bgcolor: "#fff", borderRadius: "8px" }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {!areFinishedGoodsValid && (
              <Typography sx={{ color: "#EF4444", fontSize: 12, fontWeight: 600, mb: 2.5, px: 0.5 }}>
                * Batch No, MFD Date and Expiry Date are mandatory for all finished goods, and MFD Date
                can&apos;t be after Expiry Date.
              </Typography>
            )}

            <Typography sx={{ fontWeight: 700, mb: 1, mt: 1 }}>Raw Material Consumption</Typography>
            <TableContainer component={Paper} variant="outlined" sx={[{ borderRadius: "12px" }, stackedTableSx]}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ "& th": { fontWeight: 700, bgcolor: "#F1F5F9" } }}>
                    <TableCell>Raw Material</TableCell>
                    <TableCell>UOM</TableCell>
                    <TableCell align="right">Allocated Qty</TableCell>
                    <TableCell align="right" sx={{ minWidth: 120 }}>
                      Consumed Qty
                    </TableCell>
                    <TableCell align="right">Scrap Qty</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {draft.rawMaterials.length ? (
                    draft.rawMaterials.map((rm, index) => (
                      <TableRow key={rm.productId + index}>
                        <TableCell>{rm.productName}</TableCell>
                        <TableCell data-label="UOM">{rm.uom}</TableCell>
                        <TableCell align="right" data-label="Allocated Qty">{rm.allocatedQuantity.toFixed(2)}</TableCell>
                        <TableCell align="right" data-label="Consumed Qty">
                          <TextField
                            type="number"
                            size="small"
                            value={rm.consumedQuantity}
                            disabled={committing}
                            onChange={(e) =>
                              updateRawMaterial(index, { consumedQuantity: parseFloat(e.target.value) })
                            }
                            inputProps={{ min: 0, max: rm.allocatedQuantity, style: { textAlign: "right" } }}
                            sx={{ bgcolor: "#fff", borderRadius: "8px", width: 100 }}
                          />
                        </TableCell>
                        <TableCell align="right" data-label="Scrap Qty" sx={{ color: "#94A3B8" }}>
                          {rm.scrapQuantity.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3, color: "#94A3B8" }}>
                        No allocated raw materials found for this run.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Alert severity="info" sx={{ borderRadius: "12px", mt: 2.5 }}>
              Confirming will mark this Production Target as <strong>Completed</strong>.
            </Alert>

            {commitError && (
              <Alert severity="error" sx={{ borderRadius: "12px", mt: 2 }}>
                {commitError}
              </Alert>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, bgcolor: "#F8FAFC", ...fullScreenDialogActionsSx }}>
        <Button
          onClick={onCancel}
          disabled={committing}
          variant="outlined"
          sx={{ borderRadius: "10px", textTransform: "none" }}
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          disabled={!draft || committing || !areFinishedGoodsValid}
          variant="contained"
          color="success"
          startIcon={committing ? <CircularProgress size={16} color="inherit" /> : <TaskAltIcon />}
          sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700 }}
        >
          {committing ? "Completing…" : "Complete Production"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function FieldCard({ label, value }: { label: string; value: string }) {
  return (
    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: "12px", bgcolor: "#fff" }}>
      <Typography sx={{ fontSize: 12, color: "text.secondary", mb: 0.5 }}>{label}</Typography>
      <Typography sx={{ fontWeight: 600 }}>{value || "—"}</Typography>
    </Paper>
  );
}

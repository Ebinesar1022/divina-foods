import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import FoodProductionLoader from "./FoodProductionLoader";
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

  function updateFinishedGood(index: number, patch: Partial<ConsumptionFinishedGoodDraftRow>) {
    if (!draft) return;
    const rows = draft.finishedGoods.slice();
    const row = { ...rows[index], ...patch };
    if (patch.producedQuantity !== undefined) {
      let produced = patch.producedQuantity;
      if (isNaN(produced) || produced < 0) produced = 0;
      if (produced > row.targetQuantity) produced = row.targetQuantity;
      row.producedQuantity = produced;
      row.scrapQuantity = Math.max(0, row.targetQuantity - produced);
    }
    rows[index] = row;
    onDraftChange({ ...draft, finishedGoods: rows });
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
      row.scrapQuantity = Math.max(0, row.allocatedQuantity - consumed);
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
      PaperProps={{ sx: { borderRadius: "18px", overflow: "hidden" } }}
    >
      <Box
        sx={{
          background: "linear-gradient(120deg, #065f46 0%, #059669 55%, #10b981 100%)",
          color: "#fff",
          px: 3,
          py: 2.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <TaskAltIcon />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              Complete Production
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)" }}>
              Log what was produced &amp; consumed, then wrap up this run
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onCancel} disabled={committing} sx={{ color: "#fff" }} aria-label="Close">
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 3, bgcolor: "#F8FAFC" }}>
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
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: "12px", mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ "& th": { fontWeight: 700, bgcolor: "#F1F5F9" } }}>
                    <TableCell>Finished Good</TableCell>
                    <TableCell align="right">Target Qty</TableCell>
                    <TableCell align="right" sx={{ minWidth: 120 }}>
                      Produced Qty
                    </TableCell>
                    <TableCell align="right">Scrap Qty</TableCell>
                    <TableCell sx={{ minWidth: 130 }}>Batch No</TableCell>
                    <TableCell sx={{ minWidth: 150 }}>Expiry Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {draft.finishedGoods.map((fg, index) => (
                    <TableRow key={fg.itemId + index}>
                      <TableCell>
                        {fg.itemName}
                        {fg.uom && (
                          <Typography component="span" sx={{ fontSize: 12, color: "#94A3B8", ml: 0.5 }}>
                            ({fg.uom})
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">{fg.targetQuantity}</TableCell>
                      <TableCell align="right">
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
                      <TableCell align="right" sx={{ color: "#94A3B8" }}>
                        {fg.scrapQuantity.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          placeholder="Optional"
                          value={fg.batchNo}
                          disabled={committing}
                          onChange={(e) => updateFinishedGood(index, { batchNo: e.target.value })}
                          sx={{ bgcolor: "#fff", borderRadius: "8px" }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="date"
                          size="small"
                          InputLabelProps={{ shrink: true }}
                          value={fg.expiryDate}
                          disabled={committing}
                          onChange={(e) => updateFinishedGood(index, { expiryDate: e.target.value })}
                          sx={{ bgcolor: "#fff", borderRadius: "8px" }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography sx={{ fontWeight: 700, mb: 1 }}>Raw Material Consumption</Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: "12px" }}>
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
                        <TableCell>{rm.uom}</TableCell>
                        <TableCell align="right">{rm.allocatedQuantity.toFixed(2)}</TableCell>
                        <TableCell align="right">
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
                        <TableCell align="right" sx={{ color: "#94A3B8" }}>
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

      <DialogActions sx={{ px: 3, py: 2, bgcolor: "#F8FAFC" }}>
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
          disabled={!draft || committing}
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

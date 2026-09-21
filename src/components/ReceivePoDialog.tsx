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
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import PoReceiveLoader from "./loaders/PoReceiveLoader";
import {
  fullScreenDialogActionsSx,
  fullScreenDialogPaperSx,
  stackedTableHeadControlSx,
  stackedTableSx,
} from "./common/responsive";
import type { ReceiveLineDraftRow, ReceivePoDraft } from "../types";

interface ReceivePoDialogProps {
  open: boolean;
  poNumber: string;
  draft: ReceivePoDraft | null;
  draftError: string;
  committing: boolean;
  commitError: string;
  onDraftChange: (draft: ReceivePoDraft) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ReceivePoDialog({
  open,
  poNumber,
  draft,
  draftError,
  committing,
  commitError,
  onDraftChange,
  onCancel,
  onConfirm,
}: ReceivePoDialogProps) {
  const isPreparing = !draft && !draftError;
  const today = new Date().toISOString().slice(0, 10);

  function updateLine(index: number, patch: Partial<ReceiveLineDraftRow>) {
    if (!draft) return;
    const lines = draft.lines.slice();
    const row = { ...lines[index], ...patch };
    if (patch.receivableQuantity !== undefined) {
      let qty = patch.receivableQuantity;
      if (isNaN(qty) || qty < 0) qty = 0;
      if (qty > row.pendingQuantity) qty = row.pendingQuantity;
      row.receivableQuantity = qty;
    }
    lines[index] = row;
    onDraftChange({ ...draft, lines });
  }

  // Selection reuses receivableQuantity itself (0 = not selected) rather
  // than a parallel "selected" field, so commitReceivePo only has to filter
  // on the one value it already needs — same reasoning as the Needed Items
  // checklist upstream, just without a separate ID list to keep in sync.
  function toggleLine(index: number) {
    if (!draft) return;
    const line = draft.lines[index];
    if (line.receivableQuantity > 0) {
      updateLine(index, { receivableQuantity: 0, batchNo: "", expiryDate: "" });
    } else {
      updateLine(index, { receivableQuantity: line.pendingQuantity });
    }
  }

  function toggleSelectAll() {
    if (!draft) return;
    const allSelected = draft.lines.every((l) => l.receivableQuantity > 0);
    const lines = draft.lines.map((line) =>
      allSelected
        ? { ...line, receivableQuantity: 0, batchNo: "", expiryDate: "" }
        : { ...line, receivableQuantity: line.pendingQuantity }
    );
    onDraftChange({ ...draft, lines });
  }

  // Batch_No and Expiry_Date are mandatory on Receive_Items now — only
  // require them for lines actually being received (receivableQuantity > 0)
  // so a partial receipt isn't blocked by lines nobody's touching this time.
  const selectedCount = draft ? draft.lines.filter((l) => l.receivableQuantity > 0).length : 0;
  const canSubmit =
    !!draft &&
    selectedCount > 0 &&
    draft.lines.every((l) => l.receivableQuantity <= 0 || (l.batchNo.trim() && l.expiryDate));

  return (
    <Dialog
      open={open}
      onClose={committing ? undefined : onCancel}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          position: "relative",
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
            <LocalShippingIcon sx={{ fontSize: 22 }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2, fontSize: { xs: 16, sm: 17 } }}>
              Receive Purchase Order
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)", fontSize: { xs: 12, sm: 12.5 } }}>
              {poNumber ? `Record receipt against ${poNumber}` : "Record receipt"}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onCancel} disabled={committing} sx={{ color: "#fff", flexShrink: 0 }} aria-label="Close">
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: { xs: 2, sm: 3 }, bgcolor: "#F8FAFC" }}>
        {isPreparing && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        )}

        {draftError && (
          <Alert severity="error" sx={{ borderRadius: "12px" }}>
            {draftError}
          </Alert>
        )}

        {draft && (
          <>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" }, gap: 2, mb: 2.5 }}>
              <FieldCard label="Receive No" value={draft.receiveNo} />
              <TextField
                label="Receive Date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={draft.receiveDate}
                onChange={(e) => onDraftChange({ ...draft, receiveDate: e.target.value })}
                disabled={committing}
                inputProps={{ max: today }}
                sx={{ bgcolor: "#fff", borderRadius: "10px" }}
              />
            </Box>

            <Typography sx={{ fontWeight: 700, mb: 1 }}>Items to Receive</Typography>
            <TableContainer
              component={Paper}
              variant="outlined"
              sx={[{ borderRadius: "12px" }, stackedTableSx, stackedTableHeadControlSx]}
            >
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ "& th": { fontWeight: 700, bgcolor: "#F1F5F9" } }}>
                    {/* data-label is the caption shown beside select-all on phones */}
                    <TableCell padding="checkbox" data-label="Select all">
                      <input
                        type="checkbox"
                        aria-label="Select all items"
                        checked={draft.lines.every((l) => l.receivableQuantity > 0)}
                        ref={(el) => {
                          if (el) {
                            const selectedCount = draft.lines.filter((l) => l.receivableQuantity > 0).length;
                            el.indeterminate = selectedCount > 0 && selectedCount < draft.lines.length;
                          }
                        }}
                        onChange={toggleSelectAll}
                        disabled={committing}
                      />
                    </TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Ordered</TableCell>
                    <TableCell align="right">Received</TableCell>
                    <TableCell align="right">Pending</TableCell>
                    <TableCell align="right" sx={{ minWidth: 110 }}>
                      Receiving Now
                    </TableCell>
                    <TableCell sx={{ minWidth: 130 }}>Batch No</TableCell>
                    <TableCell sx={{ minWidth: 150 }}>Expiry Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {draft.lines.map((line, index) => (
                    <TableRow key={line.poLineId} hover selected={line.receivableQuantity > 0}>
                      <TableCell padding="checkbox">
                        <input
                          type="checkbox"
                          checked={line.receivableQuantity > 0}
                          onChange={() => toggleLine(index)}
                          disabled={committing}
                        />
                      </TableCell>
                      <TableCell>
                        {line.productName}
                        {line.uomName && (
                          <Typography component="span" sx={{ fontSize: 12, color: "#94A3B8", ml: 0.5 }}>
                            ({line.uomName})
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right" data-label="Ordered">{line.orderedQuantity}</TableCell>
                      <TableCell align="right" data-label="Received">{line.receivedQuantitySoFar}</TableCell>
                      <TableCell align="right" data-label="Pending">{line.pendingQuantity}</TableCell>
                      <TableCell align="right" data-label="Receiving Now">
                        <TextField
                          type="number"
                          size="small"
                          value={line.receivableQuantity}
                          disabled={committing || line.receivableQuantity <= 0}
                          onChange={(e) => updateLine(index, { receivableQuantity: parseFloat(e.target.value) })}
                          inputProps={{ min: 0, max: line.pendingQuantity, style: { textAlign: "right" } }}
                          sx={{ bgcolor: "#fff", borderRadius: "8px", width: 100 }}
                        />
                      </TableCell>
                      <TableCell data-label="Batch No">
                        <TextField
                          size="small"
                          placeholder="Batch No"
                          value={line.batchNo}
                          disabled={committing || line.receivableQuantity <= 0}
                          onChange={(e) => updateLine(index, { batchNo: e.target.value })}
                          sx={{ bgcolor: "#fff", borderRadius: "8px", width: 120 }}
                        />
                      </TableCell>
                      <TableCell data-label="Expiry Date">
                        <TextField
                          type="date"
                          size="small"
                          value={line.expiryDate}
                          disabled={committing || line.receivableQuantity <= 0}
                          onChange={(e) => updateLine(index, { expiryDate: e.target.value })}
                          InputLabelProps={{ shrink: true }}
                          inputProps={{ min: today }}
                          sx={{ bgcolor: "#fff", borderRadius: "8px", width: 145 }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

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
          disabled={!canSubmit || committing}
          variant="contained"
          color="success"
          startIcon={committing ? <CircularProgress size={16} color="inherit" /> : <LocalShippingIcon />}
          sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700 }}
        >
          {committing ? "Receiving…" : `Confirm Receipt${selectedCount ? ` (${selectedCount})` : ""}`}
        </Button>
      </DialogActions>

      {committing && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 100,
            bgcolor: "rgba(240, 253, 244, 0.97)",
            backdropFilter: "blur(14px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            p: { xs: 1.5, sm: 3 },
            overflowY: "auto",
            animation: "receiveOverlayFadeIn 0.25s ease-out",
            "@keyframes receiveOverlayFadeIn": {
              from: { opacity: 0, transform: "scale(0.98)" },
              to: { opacity: 1, transform: "scale(1)" },
            },
          }}
        >
          <PoReceiveLoader poNumber={poNumber} itemCount={selectedCount} />
        </Box>
      )}
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

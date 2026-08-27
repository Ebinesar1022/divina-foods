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

  const canSubmit = !!draft && draft.lines.some((l) => l.receivableQuantity > 0);

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
          <LocalShippingIcon />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              Receive Purchase Order
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)" }}>
              {poNumber}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onCancel} disabled={committing} sx={{ color: "#fff" }} aria-label="Close">
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 3, bgcolor: "#F8FAFC" }}>
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
                sx={{ bgcolor: "#fff", borderRadius: "10px" }}
              />
            </Box>

            <Typography sx={{ fontWeight: 700, mb: 1 }}>Items to Receive</Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: "12px" }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ "& th": { fontWeight: 700, bgcolor: "#F1F5F9" } }}>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Ordered</TableCell>
                    <TableCell align="right">Received</TableCell>
                    <TableCell align="right">Pending</TableCell>
                    <TableCell align="right" sx={{ minWidth: 110 }}>
                      Receiving Now
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {draft.lines.map((line, index) => (
                    <TableRow key={line.poLineId}>
                      <TableCell>
                        {line.productName}
                        {line.uomName && (
                          <Typography component="span" sx={{ fontSize: 12, color: "#94A3B8", ml: 0.5 }}>
                            ({line.uomName})
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">{line.orderedQuantity}</TableCell>
                      <TableCell align="right">{line.receivedQuantitySoFar}</TableCell>
                      <TableCell align="right">{line.pendingQuantity}</TableCell>
                      <TableCell align="right">
                        <TextField
                          type="number"
                          size="small"
                          value={line.receivableQuantity}
                          disabled={committing}
                          onChange={(e) => updateLine(index, { receivableQuantity: parseFloat(e.target.value) })}
                          inputProps={{ min: 0, max: line.pendingQuantity, style: { textAlign: "right" } }}
                          sx={{ bgcolor: "#fff", borderRadius: "8px", width: 100 }}
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
          disabled={!canSubmit || committing}
          variant="contained"
          color="success"
          startIcon={committing ? <CircularProgress size={16} color="inherit" /> : <LocalShippingIcon />}
          sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700 }}
        >
          {committing ? "Receiving…" : "Confirm Receipt"}
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

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
import AddTaskIcon from "@mui/icons-material/AddTask";
import StatusChip from "./StatusChip";
import FoodProductionLoader from "./FoodProductionLoader";
import type { MrpDraft } from "../types";

interface CreateMrpDialogProps {
  open: boolean;
  draft: MrpDraft | null;
  draftError: string;
  committing: boolean;
  commitError: string;
  notes: string;
  onNotesChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function CreateMrpDialog({
  open,
  draft,
  draftError,
  committing,
  commitError,
  notes,
  onNotesChange,
  onCancel,
  onConfirm,
}: CreateMrpDialogProps) {
  const isPreparing = !draft && !draftError;

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
          background: "linear-gradient(120deg, #1e3a8a 0%, #2563eb 55%, #0ea5e9 100%)",
          color: "#fff",
          px: 3,
          py: 2.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <AddTaskIcon />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              Create Material Requirement &amp; Planning
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)" }}>
              Review the computed plan, then confirm to create it
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
            text="Exploding Recipes &amp; Bills of Materials…"
            subtext="Analyzing finished goods BOMs and calculating required raw material allocations"
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
              <FieldCard label="MRP ID" value={draft.mrpId} />
              <FieldCard label="MRP Date" value={draft.mrpDate} />
              <FieldCard label="Production Target" value={draft.productionTargetId} />
            </Box>

            <TextField
              label="Notes"
              placeholder="Optional"
              multiline
              minRows={2}
              fullWidth
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              disabled={committing}
              sx={{ mb: 3, bgcolor: "#fff", borderRadius: "10px" }}
            />

            <Typography sx={{ fontWeight: 700, mb: 1 }}>Finished Goods</Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: "12px", mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ "& th": { fontWeight: 700, bgcolor: "#F1F5F9" } }}>
                    <TableCell>Item</TableCell>
                    <TableCell>UOM</TableCell>
                    <TableCell align="right">Target Quantity</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {draft.finishedGoods.map((fg) => (
                    <TableRow key={fg.id}>
                      <TableCell>{fg.itemName}</TableCell>
                      <TableCell>{fg.uomName}</TableCell>
                      <TableCell align="right">{fg.targetQuantity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography sx={{ fontWeight: 700, mb: 1 }}>Raw Materials</Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: "12px" }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ "& th": { fontWeight: 700, bgcolor: "#F1F5F9" } }}>
                    <TableCell>Product Name</TableCell>
                    <TableCell>UOM</TableCell>
                    <TableCell align="right">Stock On Hand</TableCell>
                    <TableCell align="right">Stock Required</TableCell>
                    <TableCell align="right">Allocate Qty</TableCell>
                    <TableCell align="right">Needed Qty</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {draft.rawMaterials.map((rm) => (
                    <TableRow key={rm.productId}>
                      <TableCell>{rm.productName}</TableCell>
                      <TableCell>{rm.uom}</TableCell>
                      <TableCell align="right">{rm.stockOnHand.toFixed(2)}</TableCell>
                      <TableCell align="right">{rm.stockRequired.toFixed(2)}</TableCell>
                      <TableCell align="right">{rm.allocateQuantity.toFixed(2)}</TableCell>
                      <TableCell align="right">{rm.neededQuantity.toFixed(2)}</TableCell>
                      <TableCell>
                        <StatusChip value={rm.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {draft.hasShortfall ? (
              <Alert severity="warning" sx={{ borderRadius: "12px", mt: 2.5 }}>
                Some raw materials are short — this Production Target will move to "Waiting for Stock" once created.
              </Alert>
            ) : (
              <Alert severity="success" sx={{ borderRadius: "12px", mt: 2.5 }}>
                All raw materials are in stock — this Production Target will be marked "Released".
              </Alert>
            )}

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
          startIcon={committing ? <CircularProgress size={16} color="inherit" /> : undefined}
          sx={{ borderRadius: "10px", textTransform: "none" }}
        >
          {committing ? "Creating…" : "Create"}
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

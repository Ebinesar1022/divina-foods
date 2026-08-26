import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import type { EmployeeOption } from "../types";

interface InitiateProductionDialogProps {
  open: boolean;
  mrpId: string;
  productionTargetId: string;
  employees: EmployeeOption[];
  committing: boolean;
  commitError: string;
  startDate: string; // "YYYY-MM-DD", for the native date input
  endDate: string; // "YYYY-MM-DD", optional
  assignedToId: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onAssignedToChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function InitiateProductionDialog({
  open,
  mrpId,
  productionTargetId,
  employees,
  committing,
  commitError,
  startDate,
  endDate,
  assignedToId,
  onStartDateChange,
  onEndDateChange,
  onAssignedToChange,
  onCancel,
  onConfirm,
}: InitiateProductionDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={committing ? undefined : onCancel}
      fullWidth
      maxWidth="sm"
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
          <PlayCircleIcon />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              Start Production
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)" }}>
              Initiates production and moves this target In Progress
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onCancel} disabled={committing} sx={{ color: "#fff" }} aria-label="Close">
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 3, bgcolor: "#F8FAFC" }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" }, gap: 2, mb: 2.5 }}>
          <FieldCard label="MRP ID" value={mrpId} />
          <FieldCard label="Production Target" value={productionTargetId} />
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" }, gap: 2, mb: 2.5 }}>
          <TextField
            label="Start Date"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            disabled={committing}
            sx={{ bgcolor: "#fff", borderRadius: "10px" }}
          />
          <TextField
            label="End Date"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            disabled={committing}
            sx={{ bgcolor: "#fff", borderRadius: "10px" }}
          />
        </Box>

        <TextField
          select
          label="Assigned To"
          fullWidth
          value={assignedToId}
          onChange={(e) => onAssignedToChange(e.target.value)}
          disabled={committing}
          sx={{ bgcolor: "#fff", borderRadius: "10px" }}
        >
          <MenuItem value="">
            <em>Unassigned</em>
          </MenuItem>
          {employees.map((emp) => (
            <MenuItem key={emp.id} value={emp.id}>
              {emp.name}
            </MenuItem>
          ))}
        </TextField>

        {commitError && (
          <Alert severity="error" sx={{ borderRadius: "12px", mt: 2 }}>
            {commitError}
          </Alert>
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
          disabled={!startDate || committing}
          variant="contained"
          startIcon={committing ? <CircularProgress size={16} color="inherit" /> : undefined}
          sx={{ borderRadius: "10px", textTransform: "none" }}
        >
          {committing ? "Starting…" : "Start Production"}
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

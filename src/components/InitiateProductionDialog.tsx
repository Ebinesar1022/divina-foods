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
import { fullScreenDialogActionsSx, fullScreenDialogPaperSx } from "./common/responsive";
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
  const endBeforeStart = !!startDate && !!endDate && endDate < startDate;

  return (
    <Dialog
      open={open}
      onClose={committing ? undefined : onCancel}
      fullWidth
      maxWidth="sm"
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
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #2563eb 100%)",
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
              bgcolor: "rgba(255, 255, 255, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(8px)",
            }}
          >
            <PlayCircleIcon sx={{ fontSize: 22 }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2, fontSize: { xs: 16, sm: 17 } }}>
              Start Production
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)", fontSize: { xs: 12, sm: 12.5 } }}>
              Initiates production and moves this target In Progress
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onCancel} disabled={committing} sx={{ color: "#fff", flexShrink: 0 }} aria-label="Close">
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: { xs: 2, sm: 3 }, bgcolor: "#F8FAFC" }}>
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
            sx={{ bgcolor: "#fff", "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
          />
          <TextField
            label="End Date"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            disabled={committing}
            error={endBeforeStart}
            helperText={endBeforeStart ? "End Date can't be before Start Date" : " "}
            inputProps={{ min: startDate || undefined }}
            sx={{ bgcolor: "#fff", "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
          />
        </Box>

        <TextField
          select
          label="Assigned To"
          fullWidth
          value={assignedToId}
          onChange={(e) => onAssignedToChange(e.target.value)}
          disabled={committing}
          sx={{ bgcolor: "#fff", "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
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

      <DialogActions
        sx={{
          px: 3,
          py: 2,
          bgcolor: "#F8FAFC",
          borderTop: "1px solid rgba(148,163,184,0.18)",
          ...fullScreenDialogActionsSx,
        }}
      >
        <Button
          onClick={onCancel}
          disabled={committing}
          variant="outlined"
          sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 600 }}
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          disabled={!startDate || endBeforeStart || committing}
          variant="contained"
          startIcon={committing ? <CircularProgress size={16} color="inherit" /> : undefined}
          sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700, px: 2.5 }}
        >
          {committing ? "Starting…" : "Start Production"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function FieldCard({ label, value }: { label: string; value: string }) {
  return (
    <Paper variant="outlined" sx={{ p: 1.75, borderRadius: "14px", bgcolor: "#fff", borderColor: "rgba(226, 232, 240, 0.8)", boxShadow: "0 2px 8px rgba(15, 23, 42, 0.03)" }}>
      <Typography sx={{ fontSize: 11.5, color: "#64748B", fontWeight: 600, mb: 0.5, textTransform: "uppercase" }}>{label}</Typography>
      <Typography sx={{ fontWeight: 800, fontSize: 14.5, color: "#0F172A" }}>{value || "—"}</Typography>
    </Paper>
  );
}

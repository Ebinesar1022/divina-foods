import { Box, Typography } from "@mui/material";

export const STATUS_COLORS: Record<string, string> = {
  Planned: "#6366F1",
  "Waiting for Stock": "#EF4444",
  // MRP's own Status field vocabulary — kept here since StatusChip is
  // shared across tabs. "In Progress"/"Completed" below double as this.
  Released: "#10B981",
  Pending: "#F59E0B",
  "In Progress": "#F59E0B",
  Completed: "#10B981",
  Approved: "#10B981",
  Rejected: "#EF4444",
  Received: "#3B82F6",
};

export default function StatusChip({
  value,
  colorMap = STATUS_COLORS,
}: {
  value?: string;
  colorMap?: Record<string, string>;
}) {
  if (!value) return null;
  const color = colorMap[value] || "#6366F1";
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.75,
        px: 1.1,
        py: 0.35,
        borderRadius: "999px",
        backgroundColor: `${color}14`,
        border: `1px solid ${color}35`,
        flexShrink: 0,
      }}
    >
      <Box sx={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: color }} />
      <Typography sx={{ fontSize: 11.5, fontWeight: 700, color, lineHeight: 1, letterSpacing: "0.02em" }}>
        {value}
      </Typography>
    </Box>
  );
}

import { Box, Typography } from "@mui/material";

export const STATUS_COLORS: Record<string, string> = {
  Planned: "#6366F1",
  "Waiting for Stock": "#EF4444",
  Released: "#10B981",
  Pending: "#F59E0B",
  "In Progress": "#2563EB",
  Completed: "#10B981",
  Approved: "#10B981",
  Rejected: "#EF4444",
  Received: "#3B82F6",
  "Needs Purchase": "#EF4444",
  "Stock Available": "#10B981",
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
  const isActive = value === "In Progress" || value === "Pending";

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.75,
        px: 1.25,
        py: 0.4,
        borderRadius: "999px",
        backgroundColor: `${color}14`,
        border: `1px solid ${color}35`,
        flexShrink: 0,
        boxShadow: `0 1px 4px ${color}10`,
      }}
    >
      <Box
        sx={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          backgroundColor: color,
          ...(isActive
            ? {
                boxShadow: `0 0 0 2px ${color}30`,
              }
            : {}),
        }}
      />
      <Typography
        sx={{
          fontSize: 12,
          fontWeight: 700,
          color,
          lineHeight: 1,
          letterSpacing: "0.02em",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}


import { memo } from "react";
import { Box, Typography, keyframes } from "@mui/material";

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

const beaconPulse = keyframes`
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.55); }
  70% { transform: scale(1); box-shadow: 0 0 0 5px rgba(37, 99, 235, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
`;

function StatusChip({
  value,
  colorMap = STATUS_COLORS,
}: {
  value?: string;
  colorMap?: Record<string, string>;
}) {
  if (!value) return null;
  const color = colorMap[value] || "#6366F1";
  const isActive = value === "In Progress" || value === "Pending" || value === "Waiting for Stock";

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.85,
        px: 1.35,
        py: 0.45,
        borderRadius: "999px",
        backgroundColor: `${color}14`,
        border: `1.5px solid ${color}35`,
        flexShrink: 0,
        boxShadow: `0 2px 8px ${color}15`,
        backdropFilter: "blur(6px)",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          backgroundColor: `${color}20`,
          borderColor: `${color}55`,
          transform: "translateY(-1px)",
          boxShadow: `0 4px 12px ${color}25`,
        },
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
                animation: `${beaconPulse} 2s infinite ease-in-out`,
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

export default memo(StatusChip);



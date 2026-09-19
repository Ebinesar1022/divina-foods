import React from "react";
import {
  Snackbar,
  SnackbarOrigin,
  Box,
  Typography,
  IconButton,
  Slide,
  SlideProps,
} from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

export type SnackbarSeverity = "success" | "warning" | "error" | "info";

export interface ModernSnackbarProps {
  open: boolean;
  onClose: () => void;
  message: React.ReactNode;
  severity?: SnackbarSeverity;
  autoHideDuration?: number | null;
  anchorOrigin?: SnackbarOrigin;
  action?: React.ReactNode;
}

function SlideUpTransition(props: SlideProps) {
  return <Slide {...props} direction="up" />;
}

const SEVERITY_CONFIG: Record<
  SnackbarSeverity,
  {
    icon: React.ElementType;
    badgeBg: string;
    badgeColor: string;
    borderColor: string;
    glowShadow: string;
    progressColor: string;
  }
> = {
  success: {
    icon: CheckCircleRoundedIcon,
    badgeBg: "rgba(16, 185, 129, 0.12)",
    badgeColor: "#059669",
    borderColor: "rgba(16, 185, 129, 0.32)",
    glowShadow:
      "0 18px 40px -8px rgba(15, 23, 42, 0.12), 0 6px 18px -4px rgba(16, 185, 129, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.85) inset",
    progressColor: "linear-gradient(90deg, #10B981 0%, #34D399 100%)",
  },
  warning: {
    icon: WarningAmberRoundedIcon,
    badgeBg: "rgba(245, 158, 11, 0.12)",
    badgeColor: "#D97706",
    borderColor: "rgba(245, 158, 11, 0.32)",
    glowShadow:
      "0 18px 40px -8px rgba(15, 23, 42, 0.12), 0 6px 18px -4px rgba(245, 158, 11, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.85) inset",
    progressColor: "linear-gradient(90deg, #F59E0B 0%, #FBBF24 100%)",
  },
  error: {
    icon: ErrorOutlineRoundedIcon,
    badgeBg: "rgba(239, 68, 68, 0.12)",
    badgeColor: "#DC2626",
    borderColor: "rgba(239, 68, 68, 0.32)",
    glowShadow:
      "0 18px 40px -8px rgba(15, 23, 42, 0.12), 0 6px 18px -4px rgba(239, 68, 68, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.85) inset",
    progressColor: "linear-gradient(90deg, #EF4444 0%, #F87171 100%)",
  },
  info: {
    icon: InfoOutlinedIcon,
    badgeBg: "rgba(37, 99, 235, 0.12)",
    badgeColor: "#2563EB",
    borderColor: "rgba(37, 99, 235, 0.32)",
    glowShadow:
      "0 18px 40px -8px rgba(15, 23, 42, 0.12), 0 6px 18px -4px rgba(37, 99, 235, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.85) inset",
    progressColor: "linear-gradient(90deg, #2563EB 0%, #60A5FA 100%)",
  },
};

export default function ModernSnackbar({
  open,
  onClose,
  message,
  severity = "success",
  autoHideDuration = 4000,
  anchorOrigin = { vertical: "bottom", horizontal: "center" },
  action,
}: ModernSnackbarProps) {
  const config = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.success;
  const IconComponent = config.icon;

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={anchorOrigin}
      TransitionComponent={SlideUpTransition}
      sx={{
        bottom: { xs: 16, sm: 28 },
      }}
    >
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 1.5,
          py: 1.1,
          px: 1.75,
          borderRadius: "14px",
          backgroundColor: "rgba(255, 255, 255, 0.92)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          border: `1px solid ${config.borderColor}`,
          boxShadow: config.glowShadow,
          position: "relative",
          overflow: "hidden",
          maxWidth: { xs: "92vw", sm: 540 },
          minWidth: 280,
          pointerEvents: "auto",
        }}
      >
        {/* Modern rounded micro-badge for status icon */}
        <Box
          sx={{
            width: 30,
            height: 30,
            borderRadius: "9px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            backgroundColor: config.badgeBg,
            color: config.badgeColor,
            transition: "transform 150ms ease",
          }}
        >
          <IconComponent sx={{ fontSize: 18 }} />
        </Box>

        {/* Message */}
        <Typography
          sx={{
            fontSize: "0.875rem",
            fontWeight: 600,
            color: "#0F172A",
            letterSpacing: "-0.01em",
            lineHeight: 1.45,
            flex: 1,
            py: 0.2,
          }}
        >
          {message}
        </Typography>

        {/* Optional Action element */}
        {action}

        {/* Minimal close button */}
        {onClose && (
          <IconButton
            size="small"
            onClick={onClose}
            aria-label="close"
            sx={{
              p: 0.5,
              ml: 0.5,
              color: "#94A3B8",
              borderRadius: "8px",
              transition: "all 150ms ease",
              "&:hover": {
                color: "#1E293B",
                backgroundColor: "rgba(15, 23, 42, 0.06)",
              },
            }}
          >
            <CloseRoundedIcon sx={{ fontSize: 16 }} />
          </IconButton>
        )}

        {/* Subtle timer progress indicator at bottom edge */}
        {autoHideDuration && open ? (
          <Box
            key={`${String(message)}-${open}`}
            sx={{
              position: "absolute",
              bottom: 0,
              left: 0,
              height: "2.5px",
              background: config.progressColor,
              opacity: 0.85,
              width: "100%",
              transformOrigin: "left",
              animation: `modernToastProgress ${autoHideDuration}ms linear forwards`,
              "@keyframes modernToastProgress": {
                "0%": { transform: "scaleX(1)" },
                "100%": { transform: "scaleX(0)" },
              },
            }}
          />
        ) : null}
      </Box>
    </Snackbar>
  );
}

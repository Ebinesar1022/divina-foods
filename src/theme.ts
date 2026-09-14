import { createTheme } from "@mui/material/styles";

// ───────────── Glass design tokens ─────────────
// Shared constants for the light glassmorphism / liquid-glass look.
export const glass = {
  primary: "#2563EB",
  deepBlue: "#1E3A8A",
  cyan: "#0EA5E9",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  pageBg: "#F0F4FA",
  white: "rgba(255,255,255,0.72)",
  whiteStrong: "rgba(255,255,255,0.88)",
  border: "rgba(255,255,255,0.80)",
  borderLight: "rgba(226, 232, 240, 0.75)",
  mutedText: "#64748B",
  primaryText: "#0F172A",
  pending: "#94A3B8",
  skipped: "#CBD5E1",
  pageGradient:
    "linear-gradient(135deg, #F4F8FF 0%, #EEF5FF 45%, #F7FAFF 100%)",
};

const theme = createTheme({
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: { fontWeight: 800, letterSpacing: "-0.025em" },
    h2: { fontWeight: 800, letterSpacing: "-0.02em" },
    h3: { fontWeight: 700, letterSpacing: "-0.015em" },
    h4: { fontWeight: 700, letterSpacing: "-0.01em" },
    h5: { fontWeight: 700, letterSpacing: "-0.01em" },
    h6: { fontWeight: 600, letterSpacing: "-0.005em" },
    button: { textTransform: "none", fontWeight: 600, letterSpacing: "0.01em" },
  },
  palette: {
    mode: "light",
    primary: {
      main: "#2563eb",
      light: "#3b82f6",
      dark: "#1d4ed8",
    },
    success: {
      main: "#10b981",
      light: "#34d399",
      dark: "#059669",
    },
    error: {
      main: "#ef4444",
      light: "#f87171",
      dark: "#dc2626",
    },
    warning: {
      main: "#f59e0b",
      light: "#fbbf24",
      dark: "#d97706",
    },
    background: {
      default: glass.pageBg,
      paper: "rgba(255,255,255,0.72)",
    },
    text: {
      primary: glass.primaryText,
      secondary: glass.mutedText,
    },
    divider: "rgba(148, 163, 184, 0.18)",
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        "@keyframes floatSlow": {
          "0%, 100%": { transform: "translate3d(0, 0, 0) scale(1)" },
          "50%": { transform: "translate3d(15px, -20px, 0) scale(1.06)" },
        },
        "@keyframes floatDrift": {
          "0%, 100%": { transform: "translate3d(0, 0, 0) scale(1)" },
          "50%": { transform: "translate3d(-20px, 15px, 0) scale(1.08)" },
        },
        "@keyframes pulseGlow": {
          "0%, 100%": { opacity: 0.45, transform: "scale(1)" },
          "50%": { opacity: 0.75, transform: "scale(1.05)" },
        },
        "@keyframes fadeIn": {
          "0%": { opacity: 0, transform: "translateY(8px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        "@keyframes stampPop": {
          "0%": { opacity: 0, transform: "translate(-50%, -50%) rotate(-18deg) scale(1.45)" },
          "65%": { opacity: 1, transform: "translate(-50%, -50%) rotate(-8deg) scale(0.96)" },
          "100%": { opacity: 0.95, transform: "translate(-50%, -50%) rotate(-10deg) scale(1)" },
        },
        html: {
          overflowX: "hidden",
          scrollBehavior: "smooth",
          boxSizing: "border-box",
        },
        "*, *::before, *::after": {
          boxSizing: "inherit",
        },
        body: {
          backgroundColor: glass.pageBg,
          backgroundImage: `
            radial-gradient(circle at 8% 8%, rgba(14,165,233,0.12), transparent 32%),
            radial-gradient(circle at 92% 15%, rgba(37,99,235,0.10), transparent 35%),
            radial-gradient(circle at 75% 85%, rgba(16,185,129,0.08), transparent 32%),
            radial-gradient(circle at 18% 80%, rgba(99,102,241,0.06), transparent 30%),
            ${glass.pageGradient}
          `,
          backgroundAttachment: "fixed",
          color: glass.primaryText,
          overflowX: "hidden",
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        },
        "*::-webkit-scrollbar": { width: "6px", height: "6px" },
        "*::-webkit-scrollbar-track": { background: "transparent" },
        "*::-webkit-scrollbar-thumb": {
          backgroundColor: "rgba(148, 163, 184, 0.35)",
          borderRadius: "999px",
        },
        "*::-webkit-scrollbar-thumb:hover": {
          backgroundColor: "rgba(100, 116, 139, 0.55)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "rgba(255,255,255,0.70)",
          backdropFilter: "blur(20px) saturate(140%)",
          WebkitBackdropFilter: "blur(20px) saturate(140%)",
          border: "1px solid rgba(255,255,255,0.85)",
          boxShadow: "0 8px 32px rgba(15, 23, 42, 0.05), 0 2px 8px rgba(37, 99, 235, 0.04)",
          transition: "transform 200ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1), border-color 200ms ease",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontSize: 12,
          fontWeight: 700,
          color: "#475569",
          backgroundColor: "rgba(241,245,249,0.65)",
          letterSpacing: "0.02em",
          textTransform: "uppercase",
          borderBottom: "1px solid rgba(148,163,184,0.20)",
        },
        root: {
          borderBottom: "1px solid rgba(148,163,184,0.12)",
          fontVariantNumeric: "tabular-nums",
          fontSize: 13,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: "background-color 150ms ease",
          "&:hover": {
            backgroundColor: "rgba(37,99,235,0.035)",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "none",
          fontWeight: 600,
          transition: "all 200ms cubic-bezier(0.4, 0, 0.2, 1)",
          "&:active": {
            transform: "scale(0.98)",
          },
        },
        containedPrimary: {
          background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
          boxShadow: "0 4px 14px rgba(37, 99, 235, 0.25)",
          "&:hover": {
            background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
            boxShadow: "0 6px 20px rgba(37, 99, 235, 0.35)",
            transform: "translateY(-1px)",
          },
        },
        containedSuccess: {
          background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
          boxShadow: "0 4px 14px rgba(16, 185, 129, 0.25)",
          "&:hover": {
            background: "linear-gradient(135deg, #34D399 0%, #10B981 100%)",
            boxShadow: "0 6px 20px rgba(16, 185, 129, 0.35)",
            transform: "translateY(-1px)",
          },
        },
        outlined: {
          backgroundColor: "rgba(255,255,255,0.7)",
          borderColor: "rgba(148,163,184,0.30)",
          backdropFilter: "blur(8px)",
          "&:hover": {
            borderColor: "#2563EB",
            backgroundColor: "rgba(255,255,255,0.95)",
            boxShadow: "0 4px 12px rgba(37, 99, 235, 0.08)",
            transform: "translateY(-1px)",
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
          boxShadow: "0 24px 60px rgba(15, 23, 42, 0.20)",
          border: "1px solid rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(20px)",
        },
      },
    },
  },
});

export default theme;


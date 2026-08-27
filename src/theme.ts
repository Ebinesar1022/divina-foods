import { createTheme } from "@mui/material/styles";

// ───────────── Glass design tokens ─────────────
// Shared constants for the light glassmorphism / liquid-glass look. Exported
// so components that need a bespoke glass surface (hero, stamp, ambient
// blobs) can reuse the same palette instead of re-deriving colors.
export const glass = {
  primary: "#2563EB",
  deepBlue: "#1E3A8A",
  cyan: "#0EA5E9",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  pageBg: "#F0F4FA",
  white: "rgba(255,255,255,0.68)",
  whiteStrong: "rgba(255,255,255,0.82)",
  border: "rgba(255,255,255,0.70)",
  mutedText: "#64748B",
  primaryText: "#172033",
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
    h6: { fontWeight: 600 },
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
      paper: "rgba(255,255,255,0.68)",
    },
    text: {
      primary: glass.primaryText,
      secondary: glass.mutedText,
    },
    divider: "rgba(148, 163, 184, 0.24)",
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
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
            radial-gradient(circle at 5% 10%, rgba(14,165,233,0.10), transparent 28%),
            radial-gradient(circle at 90% 20%, rgba(37,99,235,0.08), transparent 30%),
            radial-gradient(circle at 70% 90%, rgba(16,185,129,0.06), transparent 28%),
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
          backgroundColor: "rgba(148, 163, 184, 0.4)",
          borderRadius: "999px",
        },
        "*::-webkit-scrollbar-thumb:hover": {
          backgroundColor: "rgba(100, 116, 139, 0.6)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "rgba(255,255,255,0.62)",
          backdropFilter: "blur(18px) saturate(130%)",
          WebkitBackdropFilter: "blur(18px) saturate(130%)",
          border: "1px solid rgba(255,255,255,0.75)",
          transition: "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontSize: 12,
          fontWeight: 700,
          color: glass.mutedText,
          backgroundColor: "rgba(241,245,249,0.55)",
        },
        root: {
          borderBottom: "1px solid rgba(148,163,184,0.12)",
          fontVariantNumeric: "tabular-nums",
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:hover": {
            backgroundColor: "rgba(37,99,235,0.035)",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          boxShadow: "none",
        },
        containedPrimary: {
          backgroundColor: "#2563EB",
          boxShadow: "0 5px 14px rgba(37, 99, 235, 0.18)",
          "&:hover": {
            backgroundColor: "#1D4ED8",
            boxShadow: "0 6px 18px rgba(37, 99, 235, 0.24)",
          },
        },
        outlined: {
          backgroundColor: "rgba(255,255,255,0.6)",
          borderColor: "rgba(148,163,184,0.35)",
          "&:hover": {
            borderColor: "rgba(148,163,184,0.55)",
            backgroundColor: "rgba(255,255,255,0.8)",
          },
        },
      },
    },
  },
});

export default theme;

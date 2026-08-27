import { createTheme } from "@mui/material/styles";

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
      default: "#f1f5f9",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#0F172A",
      secondary: "#64748B",
    },
    divider: "#E2E8F0",
  },
  shape: {
    borderRadius: 14,
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
          backgroundColor: "#f1f5f9",
          color: "#0F172A",
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
          transition: "box-shadow 0.2s ease, border-color 0.2s ease",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          boxShadow: "none",
          "&:hover": {
            boxShadow: "0 4px 12px rgba(37, 99, 235, 0.2)",
          },
        },
      },
    },
  },
});

export default theme;


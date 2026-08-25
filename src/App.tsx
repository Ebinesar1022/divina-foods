import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "./theme";
import ProductionOverview from "./components/ProductionOverview";

// In production, Creator passes the record ID via the widget's URL params
// or ZOHO.CREATOR.UTIL.getQueryParams() — swap this for that call once
// wired into the real Overview_Test page.
const PRODUCTION_TARGET_ID = "PT-105";

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ProductionOverview productionTargetId={PRODUCTION_TARGET_ID} />
    </ThemeProvider>
  );
}

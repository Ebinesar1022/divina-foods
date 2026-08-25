import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "./theme";
import ProductionOverview from "./components/ProductionOverview";

export default function App({ productionTargetId }: { productionTargetId: string }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ProductionOverview productionTargetId={productionTargetId} />
    </ThemeProvider>
  );
}

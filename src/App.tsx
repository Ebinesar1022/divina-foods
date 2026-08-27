import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "./theme";
import ProductionOverview from "./components/ProductionOverview";
import AmbientBackground from "./components/common/AmbientBackground";

export default function App({ productionTargetId }: { productionTargetId: string }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AmbientBackground />
      <ProductionOverview productionTargetId={productionTargetId} />
    </ThemeProvider>
  );
}

import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const emptyModulePath = fileURLToPath(
  new URL("./src/utils/emptyModule.js", import.meta.url)
);

export default defineConfig({
  base: "./",
  plugins: [react()],
  resolve: {
    alias: {
      // jsPDF lazily imports these only for its unused `.html()` renderer
      // (we only use jsPDF + jspdf-autotable for table-based PDFs). Alias
      // them to an empty stub so they aren't pulled into the build at all.
      html2canvas: emptyModulePath,
      dompurify: emptyModulePath,
    },
  },
  build: {
    target: "es2015",
    outDir: "overview_z/app/react",
    emptyOutDir: true,
    chunkSizeWarningLimit: 5000,
  },
});

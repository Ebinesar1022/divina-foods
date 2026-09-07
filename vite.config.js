import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import legacy from "@vitejs/plugin-legacy";

// iOS Safari inside the Creator mobile app can fail to parse modern
// (ES2020+) bundles even when the code itself avoids async/await.
// The legacy plugin emits a fallback bundle so the widget still loads
// on older embedded webviews.
export default defineConfig({
  base: "./",
  plugins: [react(), legacy({ targets: ["iOS >= 12", "Safari >= 12"] })],
  build: {
    target: "es2015",
    outDir: "overview_z/app/react",
      emptyOutDir: true,
      chunkSizeWarningLimit: 5000,
  },
});

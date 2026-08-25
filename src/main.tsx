import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

const DEFAULT_ID = "PT-105";

function mount(productionTargetId: string) {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App productionTargetId={productionTargetId} />
    </React.StrictMode>
  );
}

// Dev-only: if window.ZOHO isn't present (running outside the Creator
// shell via `npm run dev`), install mock data so the page renders.
if (import.meta.env.DEV && !(window as any).ZOHO) {
  import("./mocks/mockZoho").then(function (mod) {
    mod.installMockZoho();
    mount(DEFAULT_ID);
  });
} else {
  // NOTE: this project uses the Creator JS API v2, where
  // ZOHO.CREATOR.init() is not required and is not a function — calling
  // it will throw. getQueryParams() can be called directly.
  //
  // "production_target_id" must match the page variable name configured
  // in Zoho Creator's Page Builder (Page Variables and Script tab) on the
  // page that hosts this widget — if that name differs in the actual
  // Creator app, this is the one line to update.
  (window as any).ZOHO.CREATOR.UTIL.getQueryParams()
    .then(function (params: Record<string, string>) {
      mount((params && params.production_target_id) || DEFAULT_ID);
    })
    .catch(function () {
      mount(DEFAULT_ID);
    });
}

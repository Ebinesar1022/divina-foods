import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

function mount() {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

// Dev-only: if window.ZOHO isn't present (running outside the Creator
// shell via `npm run dev`), install mock data so the page renders.
if (import.meta.env.DEV && !(window as any).ZOHO) {
  import("./mocks/mockZoho").then(function (mod) {
    mod.installMockZoho();
    mount();
  });
} else {
  mount();
}

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

const DEFAULT_ID = "PT-105";
// How long startup waits for the Creator widget SDK, then for getQueryParams().
const SDK_WAIT_MS = 5000;
const QUERY_PARAMS_TIMEOUT_MS = 15000;

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
  startInCreator();
}

// Startup used to call ZOHO.CREATOR.UTIL.getQueryParams() straight away and
// only draw the page once it answered — if the widget SDK hadn't loaded yet
// (or never answered, as seen in the Creator iPhone app) the widget stayed
// blank or threw before drawing anything. Wait briefly for the SDK, and show
// the reason on screen instead of hanging.
function startInCreator() {
  let mounted = false;
  function mountOnce(productionTargetId: string) {
    if (mounted) return;
    mounted = true;
    mount(productionTargetId);
  }
  function failOnce(message: string) {
    if (mounted) return;
    mounted = true;
    showStartupError(message);
  }

  waitForCreatorUtil(SDK_WAIT_MS).then(function (util) {
    if (!util) {
      failOnce("The Zoho Creator widget SDK didn't load.");
      return;
    }
    window.setTimeout(function () {
      failOnce(
        "Zoho Creator didn't send this page's details within " +
          QUERY_PARAMS_TIMEOUT_MS / 1000 +
          " seconds.",
      );
    }, QUERY_PARAMS_TIMEOUT_MS);
    Promise.resolve()
      .then(function () {
        return util.getQueryParams();
      })
      .then(function (params: Record<string, string>) {
        mountOnce((params && params.production_target_id) || DEFAULT_ID);
      })
      .catch(function () {
        mountOnce(DEFAULT_ID);
      });
  });
}

function waitForCreatorUtil(maxWaitMs: number): Promise<any> {
  return new Promise(function (resolve) {
    const startedAt = Date.now();
    (function check() {
      const zoho = (window as any).ZOHO;
      const util = zoho && zoho.CREATOR && zoho.CREATOR.UTIL;
      if (util && typeof util.getQueryParams === "function") {
        resolve(util);
      } else if (Date.now() - startedAt >= maxWaitMs) {
        resolve(null);
      } else {
        window.setTimeout(check, 200);
      }
    })();
  });
}

function showStartupError(message: string) {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <div style={{ fontFamily: "Inter, sans-serif", textAlign: "center", padding: "48px 24px", color: "#0F172A" }}>
      <h2 style={{ fontSize: 18, margin: "0 0 8px" }}>Couldn't open the Production Overview</h2>
      <p style={{ fontSize: 14, color: "#64748B", margin: "0 0 16px" }}>{message}</p>
      <button
        onClick={() => window.location.reload()}
        style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: "#2563eb", color: "#fff", fontWeight: 700 }}
      >
        Reload
      </button>
    </div>
  );
}

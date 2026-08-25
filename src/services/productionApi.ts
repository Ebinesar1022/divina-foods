// ─────────────────────────────────────────────
// productionApi.ts
// All calls use .then()/.catch() chains instead of async/await,
// matching the pattern used across Divina Foods' other Creator
// widgets (see maint-dashboard reference) — plain Promise chaining
// is the safest path for widget code running inside the Creator
// mobile app's embedded iOS Safari webview.
// ─────────────────────────────────────────────

import type {
  ConsumptionEntryRow,
  MrpRow,
  ProcurementRow,
  ProductionInProgressRow,
  ProductionTargetRow,
} from "../types";

declare global {
  interface Window {
    ZOHO: any;
  }
}

// ⚠️ Confirm every *_REPORT value against Creator → Reports (case sensitive).
// These are the 5 pipeline stages; Procurement covers 2 forms (PO + PR)
// that get merged into a single "Procurement" tab/stage in the UI.
export const CONFIG = {
  APP_NAME: "divina-foods",
  PRODUCTION_TARGET_REPORT: "Production_Target_Report",
  MRP_REPORT: "Material_Requirement_Planning_Report",
  PURCHASE_ORDER_REPORT: "Purchase_Order_Report",
  PURCHASE_RECEIVE_REPORT: "Purchase_Receive_Report",
  PRODUCTION_INPROGRESS_REPORT: "Production_Inprogress",
  CONSUMPTION_ENTRY_REPORT: "Consumption_Entry_Report",
};

function display(value: any): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "object") {
    return value.zc_display_value || value.display_value || value.Name || "";
  }
  return "";
}

// Generic fetch — every read on this page goes through this one function.
function getRecords(reportName: string, criteria?: string, maxRecords = 200): Promise<any[]> {
  return window.ZOHO.CREATOR.DATA.getRecords({
    app_name: CONFIG.APP_NAME,
    report_name: reportName,
    criteria: criteria || "",
    field_config: "all",
    max_records: maxRecords,
  })
    .then(function (resp: any) {
      if (!resp || resp.code !== 3000 || !resp.data) return [];
      return resp.data;
    })
    .catch(function (err: any) {
      // Creator throws a rejected promise (not code 3000) when a report has 0 rows.
      if (err && (err.code === 9280 || /no records? found/i.test(err.message || ""))) {
        return [];
      }
      console.error("getRecords failed for " + reportName, err);
      return [];
    });
}

// ───────────── Production Target ─────────────
export function fetchProductionTarget(productionTargetId: string): Promise<ProductionTargetRow | null> {
  const criteria = `Production_Target_ID == "${productionTargetId}"`;
  return getRecords(CONFIG.PRODUCTION_TARGET_REPORT, criteria).then(function (rows) {
    if (!rows.length) return null;
    const r = rows[0];
    return {
      id: r.ID,
      productionTargetId: display(r.Production_Target_ID),
      date: display(r.Date_field),
      assignedBy: display(r.Assigned_By6787696),
      status: display(r.Status),
      notes: display(r.Notes),
      stageStatus: display(r.Stage_Status) as any,
      rawMaterialUsed: display(r.Raw_Material_Used),
      costPrice: display(r.Cost_Price),
      directLabours: display(r.Direct_Labours),
      totalCosts: display(r.Total_Costs),
      factoryOverheads: display(r.Factory_Overheads),
    };
  });
}

// ───────────── Material Requirement & Planning ─────────────
export function fetchMrpRecord(productionTargetId: string): Promise<MrpRow | null> {
  const criteria = `Production_Target_ID == "${productionTargetId}"`;
  return getRecords(CONFIG.MRP_REPORT, criteria).then(function (rows) {
    if (!rows.length) return null;
    const r = rows[0];
    return {
      id: r.ID,
      mrpId: display(r.MRP_ID),
      productionTargetId: display(r.Production_Target_ID),
      date: display(r.Date_field),
      createdBy: display(r.Created_By45657),
      notes: display(r.Notes),
      stockStatus: display(r.Stock_Status) as any,
    };
  });
}

// ───────────── Procurement (Purchase Order + Purchase Receive, merged) ─────────────
export function fetchProcurementRecords(productionTargetId: string): Promise<ProcurementRow[]> {
  const criteria = `Production_Target_ID == "${productionTargetId}"`;

  const purchaseOrders = getRecords(CONFIG.PURCHASE_ORDER_REPORT, criteria).then(function (rows) {
    return rows.map(function (r: any) {
      return {
        id: r.ID,
        type: "purchase_order" as const,
        recordNo: display(r.PO_No) || display(r.Purchase_Order_ID),
        mrpId: display(r.MRP_ID),
        productionTargetId: display(r.Production_Target_ID),
        date: display(r.Date_field),
        supplier: display(r.Supplier),
        receivedBy: "",
        status: display(r.Status),
      };
    });
  });

  const purchaseReceives = getRecords(CONFIG.PURCHASE_RECEIVE_REPORT, criteria).then(function (rows) {
    return rows.map(function (r: any) {
      return {
        id: r.ID,
        type: "purchase_receive" as const,
        recordNo: display(r.PR_No) || display(r.Purchase_Receive_ID),
        mrpId: display(r.MRP_ID),
        productionTargetId: display(r.Production_Target_ID),
        date: display(r.Date_field),
        supplier: display(r.Supplier),
        receivedBy: display(r.Received_By),
        status: display(r.Status),
      };
    });
  });

  return Promise.all([purchaseOrders, purchaseReceives]).then(function (results) {
    return [...results[0], ...results[1]].sort(function (a, b) {
      return a.date < b.date ? 1 : -1;
    });
  });
}

// ───────────── Production In-progress ─────────────
export function fetchProductionInProgress(productionTargetId: string): Promise<ProductionInProgressRow[]> {
  const criteria = `Production_Target_ID == "${productionTargetId}"`;
  return getRecords(CONFIG.PRODUCTION_INPROGRESS_REPORT, criteria).then(function (rows) {
    return rows.map(function (r: any) {
      return {
        id: r.ID,
        productionTargetId: display(r.Production_Target_ID),
        date: display(r.Date_field),
        assignedBy: display(r.Assigned_By),
        productionStatus: display(r.Production_Status),
      };
    });
  });
}

// ───────────── Consumption Entry ─────────────
export function fetchConsumptionEntries(productionTargetId: string): Promise<ConsumptionEntryRow[]> {
  const criteria = `Production_Target_ID == "${productionTargetId}"`;
  return getRecords(CONFIG.CONSUMPTION_ENTRY_REPORT, criteria).then(function (rows) {
    return rows.map(function (r: any) {
      return {
        id: r.ID,
        productionTargetId: display(r.Production_Target_ID),
        date: display(r.Date_field),
        createdBy: display(r.Created_By),
        status: display(r.Status),
        consumedQty: display(r.Consumed_Qty),
      };
    });
  });
}

// Fetch everything the Production Overview page needs, still no async/await —
// Promise.all is native ES6 and fine (generator-based async/await
// transpilation is the actual iOS Safari problem, not Promises themselves).
export function fetchProductionOverview(productionTargetId: string) {
  return Promise.all([
    fetchProductionTarget(productionTargetId),
    fetchMrpRecord(productionTargetId),
  ]).then(function (results) {
    const record = results[0];
    const mrpRecord = results[1];
    const procurementNeeded = !!mrpRecord && mrpRecord.stockStatus === "Waiting for Stock";

    return Promise.all([
      procurementNeeded ? fetchProcurementRecords(productionTargetId) : Promise.resolve([]),
      fetchProductionInProgress(productionTargetId),
      fetchConsumptionEntries(productionTargetId),
    ]).then(function (rest) {
      return {
        record,
        mrpRecord,
        procurementRecords: rest[0],
        productionInProgress: rest[1],
        consumptionEntries: rest[2],
      };
    });
  });
}

// ─────────────────────────────────────────────
// productionApi.ts
// All calls use .then()/.catch() chains instead of async/await,
// matching the pattern used across Divina Foods' other Creator
// widgets (see maint-dashboard reference) — plain Promise chaining
// is the safest path for widget code running inside the Creator
// mobile app's embedded iOS Safari webview.
// ─────────────────────────────────────────────

import type {
  BatchAllocationLine,
  BomItemRow,
  ConsumptionEntryDraft,
  ConsumptionEntryRow,
  CreateMrpResult,
  CreatePoDraft,
  EmployeeOption,
  FinishedGoodTargetRow,
  MrpDetailData,
  MrpDraft,
  MrpRow,
  NonStockItemRow,
  PaymentTermOption,
  PoLineRow,
  ProductionInProgressRow,
  ProductionTargetRow,
  ProductionTargetStatus,
  PurchaseOrderDetail,
  RawMaterialNeedRow,
  ReceivePoDraft,
  StartProductionDetails,
  SupplierOption,
  TaxOption,
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

  // Confirmed against the app's .ds export (Divina_Foods_3.ds).
  FINISHED_GOODS_REPORT: "Finished_Goods_Report",
  FINISHED_GOODS_FORM: "Finished_Goods",
  PRODUCT_MASTER_REPORT: "Product_Master_Report",
  BOM_MASTER_REPORT: "BOM_Master_Report",
  BOM_ITEMS_REPORT: "BOM_Items_Report",
  MAIN_WAREHOUSE_STOCK_REPORT: "Main_Warehouse_Stock_Details_Report",
  // ⚠️ Following this file's report-name-minus-"_Report" convention (holds
  // for every other form/report pair above) — confirm against Creator if a
  // new-row insert ever comes back "Failed to create a record".
  MAIN_WAREHOUSE_STOCK_FORM: "Main_Warehouse_Stock_Details",
  SEQUENCE_MASTER_REPORT: "Sequence_Master_Report",
  // Confirmed against live DevTools traffic: this is a report directly on
  // Warehouse_Master (not a separate "Warehouse" wrapper form), listing
  // every physical warehouse (Main, Production, Scrap, ...) with
  // Warehouse_Name as plain text — not a lookup.
  WAREHOUSE_REPORT: "Warehouse_Master_Report",
  MRP_FORM: "Material_Requirement_Planning",
  RAW_MATERIALS_FORM: "Raw_Materials",
  RAW_MATERIALS_REPORT: "Raw_Materials_Report",

  EMPLOYEE_REPORT: "Employee_Report",

  // Confirmed against the app's .ds export (Divina_Foods_6.ds) — the
  // "Required Materials" custom action on the MRP list opens
  // Non_Stock_Items_Report?MRP_ID=<MRP_ID>, which reads from this
  // separate Non_Stock_Items form, NOT Raw_Materials.
  NON_STOCK_ITEMS_FORM: "Non_Stock_Items",
  NON_STOCK_ITEMS_REPORT: "Non_Stock_Items_Report",
  UOM_MASTER_REPORT: "UOM_Master_Report",

  // Confirmed against the app's .ds export (Divina_Foods_7.ds) — the full
  // Procurement flow: Purchase_Order has a PO_Line_Items grid (per-product
  // order lines), Purchase_Receive has a Receive_Items grid (per-product
  // received quantities for one receipt against one PO).
  PURCHASE_ORDER_FORM: "Purchase_Order",
  PO_LINE_ITEMS_FORM: "PO_Line_Items",
  PO_LINE_ITEMS_REPORT: "PO_Line_Items_Report",
  PURCHASE_RECEIVE_FORM: "Purchase_Receive",
  RECEIVE_ITEMS_FORM: "Receive_Items",
  RECEIVE_ITEMS_REPORT: "Receive_Items_Report",
  SUPPLIER_REPORT: "Supplier_Report",
  PAYMENT_TERM_REPORT: "Payment_Term_Report",
  TAX_MASTER_REPORT: "Tax_Master_Report",

  // Confirmed against the app's .ds export (Divina_Foods_5.ds) —
  // Consumption_Entry's two grids (Finished_Good, Raw_Material_Consumptions)
  // are subform-backing forms, same pattern as MRP's Finished_Goods/Raw_Materials.
  CONSUMPTION_ENTRY_FORM: "Consumption_Entry",
  FINISHED_GOODS_CONSUMPTIONS_FORM: "Finished_Goods_Cunsumptions",
  FINISHED_GOODS_CONSUMPTIONS_REPORT: "Finished_Goods_Cunsumptions_Report",
  CONSUMPTION_ITEMS_FORM: "Consumption_Items",
  CONSUMPTION_ITEMS_REPORT: "Consumption_Items_Report",

  // Combined header + lines save. The Field Link Name of each subform field
  // on the parent form (Form builder → click the subform → Field Link Name).
  // When one is set, that subform's rows are sent inside the header's own
  // addRecords payload — one request for the header and all its lines,
  // like the POS widget's Product_Details — instead of one request per
  // line. Left blank, each line is written as its own row in the subform's
  // form (the old way). ⚠️ Only fill these in after checking the name in
  // Creator: a wrong name can save the header without its lines.
  CONSUMPTION_FINISHED_GOODS_SUBFORM: "", // on Consumption_Entry → Finished_Goods_Cunsumptions
  CONSUMPTION_RAW_MATERIALS_SUBFORM: "", // on Consumption_Entry → Consumption_Items
  MRP_FINISHED_GOODS_SUBFORM: "", // on Material_Requirement_Planning → Finished_Goods
  MRP_RAW_MATERIALS_SUBFORM: "", // on Material_Requirement_Planning → Raw_Materials
  PO_LINE_ITEMS_SUBFORM: "", // on Purchase_Order → PO_Line_Items
  RECEIVE_ITEMS_SUBFORM: "", // on Purchase_Receive → Receive_Items

  // Warehouse stock ledgers touched by completing production — confirmed
  // against the app's .ds export. All three are plain Creator forms (no
  // external Zoho Inventory connection involved), unlike the separate
  // "Update Inventory Adjustment" workflow.
  SCRAP_WAREHOUSE_STOCK_REPORT: "Scrap_Warehouse_Stock_Details_Report",
  // ⚠️ Same report-name-minus-"_Report" convention as MAIN_WAREHOUSE_STOCK_FORM —
  // confirm against Creator if a new-row insert ever comes back "Failed to
  // create a record".
  SCRAP_WAREHOUSE_STOCK_FORM: "Scrap_Warehouse_Stock_Details",
  PRODUCTION_STOCK_REPORT: "Production_Stock_Details_Report",
  // Per-batch stock ledger on Product_Master — same report-name-minus-
  // "_Report" form-name convention as the other pairs above.
  BATCH_DETAILS_REPORT: "All_Batch_Details",
  BATCH_DETAILS_FORM: "Batch_Details",

  // Confirmed against the app's .ds export — FEFO_Batch_Allocation (header,
  // Production_Targets lookup) + Batch_Allocation (its grid, linked back via
  // FEFO_Batch_ID) is the native persistent record for a Start Production
  // run's FEFO pick. AllocateAndCommitBatch now writes one of these so the
  // widget can read it back after a reload instead of only holding it in
  // React state.
  FEFO_BATCH_ALLOCATION_REPORT: "FEFO_Batch_Allocation_Report",
  BATCH_ALLOCATION_REPORT: "All_Batch_Allocations",

  // File Upload field on Production_Targets that receives the generated
  // Batch Allocation PDF on phones (the Creator mobile app's webview can't
  // save a Blob download, so the PDF is opened from a real Creator URL).
  BATCH_ALLOCATION_PDF_FIELD: "Batch_Allocation_PDF",
  // Fallbacks for the file URL — the origin normally comes from the widget's
  // own ?serviceOrigin=… (see creatorServiceOrigin). Owner/app read from the
  // live app URL: https://creatorapp.zoho.com.au/<ACCOUNT_OWNER>/<APP_NAME>/
  CREATOR_ORIGIN: "https://creatorapp.zoho.com.au",
  ACCOUNT_OWNER: "info_divinafoodco",
};

function display(value: any): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number")
    return String(value);
  if (typeof value === "object") {
    return value.zc_display_value || value.display_value || value.Name || "";
  }
  return "";
}

// Pulls the raw record ID out of a lookup field's response shape
// ({ ID, zc_display_value, ... }), falling back to the raw value itself
// when the field already comes back as a bare ID string.
function lookupId(value: any): string {
  if (value == null) return "";
  if (typeof value === "object")
    return value.ID != null ? String(value.ID) : "";
  return String(value);
}

// Rounds a computed quantity to 4 decimal places before it's ever written
// to Zoho. BOM math (quantityRequired * targetQuantity, then summed across
// finished goods) routinely lands on IEEE754 noise like 0.30000000000000004
// — that has 17 significant digits once JSON-serialized, which Creator's
// decimal fields reject outright with "<Field> has exceeded its maximum
// digits" (code 3001). Rounding at the point every derived quantity is
// produced keeps that noise from ever reaching a payload.
function roundQty(value: number): number {
  if (!isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 10000) / 10000;
}

// Same IEEE754-noise problem as roundQty, but for currency fields
// (Unit_Price, Line_Total, Tax_Amount, Sub_Total, Grand_Total). Those are
// configured in Creator with 2 decimal places, not 4 — rounding tax math
// (Line_Total * Tax_Percentage / 100) to 4 decimals routinely leaves a
// 3rd/4th decimal digit (e.g. 9.9998), which Creator rejects the same way
// with "<Field> has exceeded its maximum digits" (code 3001).
function roundMoney(value: number): number {
  if (!isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

// Employee.Employee_Name is a "name"-type field — comes back as
// { prefix, first_name, last_name, suffix }, matching the displayformat
// used for Assigned_To lookups elsewhere in the app (Production_Targets,
// Production_Order): "prefix first_name last_name suffix".
function formatEmployeeName(nameField: any): string {
  if (!nameField || typeof nameField !== "object") return "";
  return [
    nameField.prefix,
    nameField.first_name,
    nameField.last_name,
    nameField.suffix,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
}

// ───────────── Request queue ─────────────
// Creator caps how many API calls one session can have in flight at once;
// past that cap a call fails with code 2955 ("You have reached the maximum
// number of API calls that can be simultaneously initiated at a time").
// Every SDK call below goes through this queue, which keeps at most
// MAX_IN_FLIGHT running and starts the next one as soon as a slot frees up,
// so independent requests can be fired together (Promise.all) without
// tripping the cap. It's the same limiter as the POS widget's ZQ helper.
// A call that still comes back 2955 was never started on the server, so
// it's safe to retry it after a short pause.
const MAX_IN_FLIGHT = 4;
const CAP_RETRIES = 3;
let inFlight = 0;
const queued: Array<() => void> = [];

function startQueued(): void {
  while (inFlight < MAX_IN_FLIGHT && queued.length) {
    queued.shift()!();
  }
}

function isCapReached(value: any): boolean {
  if (!value) return false;
  if (value.code === 2955 || value.code === "2955") return true;
  const text =
    typeof value === "string" ? value : value.description || value.message;
  return /\b2955\b|maximum number of API calls/i.test(String(text || ""));
}

function callWithCapRetry<T>(
  call: () => Promise<T>,
  attempt: number,
): Promise<T> {
  function retry(): Promise<T> {
    return new Promise<void>(function (resolve) {
      setTimeout(resolve, 400 * (attempt + 1));
    }).then(function () {
      return callWithCapRetry(call, attempt + 1);
    });
  }
  return Promise.resolve()
    .then(call)
    .then(
      function (resp) {
        return attempt < CAP_RETRIES && isCapReached(resp) ? retry() : resp;
      },
      function (err) {
        if (attempt < CAP_RETRIES && isCapReached(err)) return retry();
        throw err;
      },
    );
}

function zohoCall<T>(call: () => Promise<T>): Promise<T> {
  return new Promise<T>(function (resolve, reject) {
    queued.push(function () {
      inFlight++;
      callWithCapRetry(call, 0)
        .then(resolve, reject)
        .then(function () {
          inFlight--;
          startQueued();
        });
    });
    startQueued();
  });
}

// window.ZOHO.CREATOR.DATA.<method>(params), through the queue above.
function zohoData(method: string, params: Record<string, any>): Promise<any> {
  return zohoCall(function () {
    return window.ZOHO.CREATOR.DATA[method](params);
  });
}

// Runs `task` for every item at once; the request queue above keeps the
// number of calls actually in flight under Creator's cap.
function runAll<T, R>(items: T[], task: (item: T) => Promise<R>): Promise<R[]> {
  return Promise.all(items.map(task));
}

// Generic fetch — every read on this page goes through this one function.
function getRecords(
  reportName: string,
  criteria?: string,
  maxRecords = 200,
): Promise<any[]> {
  return zohoData("getRecords", {
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
      if (
        err &&
        (err.code === 9280 || /no records? found/i.test(err.message || ""))
      ) {
        return [];
      }
      console.error("getRecords failed for " + reportName, err);
      return [];
    });
}

// `field == value` — quoted for a text field, bare for a lookup/ID.
function equalsCriteria(field: string, value: string, quoted: boolean): string {
  return quoted ? `${field} == "${value}"` : `${field} == ${value}`;
}

// Batched lookup: every row of `reportName` whose `field` matches any of
// `ids`, via OR'd criteria (`F == 1 || F == 2 || …`) — one request per chunk
// instead of one per ID. Chunked so the criteria string stays short, and
// read with the 1000-row page size since one call now covers many parents'
// children. Pass `quoted` for a text field (e.g. Batch_Number).
const BATCH_CHUNK = 25;
function getRecordsByIds(
  reportName: string,
  field: string,
  ids: string[],
  quoted = false,
): Promise<any[]> {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  if (!unique.length) return Promise.resolve([]);
  const chunks: string[][] = [];
  for (let i = 0; i < unique.length; i += BATCH_CHUNK) {
    chunks.push(unique.slice(i, i + BATCH_CHUNK));
  }
  return runAll(chunks, function (chunk) {
    const criteria = chunk
      .map(function (id) {
        return equalsCriteria(field, id, quoted);
      })
      .join(" || ");
    return getRecords(reportName, criteria, 1000);
  }).then(function (pages) {
    return ([] as any[]).concat(...pages);
  });
}

// The first row for each key — one batched read (getRecordsByIds), then any
// key that read didn't come back with is re-checked on its own with the
// plain single-key criteria. The batched read alone is never taken to mean
// "no row": an earlier batched version of the MRP stock reservation was
// reverted because rows went unmatched, and a missed row here would create
// a duplicate stock row (or skip a release) instead of updating the real one.
// Keys are matched with `keyOf`, so a row is only ever used for its own key.
function fetchFirstRowByKey(
  reportName: string,
  field: string,
  keys: string[],
  keyOf: (row: any) => string,
  quoted = false,
): Promise<Map<string, any>> {
  const unique = Array.from(new Set(keys.filter(Boolean)));
  return getRecordsByIds(reportName, field, unique, quoted).then(
    function (rows) {
      const found = new Map<string, any>();
      rows.forEach(function (row) {
        const key = keyOf(row);
        if (key && !found.has(key)) found.set(key, row);
      });
      const missing = unique.filter(function (key) {
        return !found.has(key);
      });
      return runAll(missing, function (key) {
        return getRecords(reportName, equalsCriteria(field, key, quoted)).then(
          function (single) {
            if (single.length) found.set(key, single[0]);
          },
        );
      }).then(function () {
        return found;
      });
    },
  );
}

function productOf(row: any): string {
  return lookupId(row.Product_Master);
}

// ───────────── In-memory stock edits ─────────────
// A save that touches many stock rows reads them all up front, applies every
// line's change to these in-memory edits — in the same order the old
// read-then-write-per-line code applied them, so a row hit by two lines ends
// up with both changes — and then writes each row once.
interface StockEdit {
  row: any | null; // the row as read; null for a row this save creates
  create: Record<string, any> | null; // fixed fields of a new row
  changes: Record<string, number>;
  remove: boolean;
}

function existingStockEdit(row: any): StockEdit {
  return { row: row, create: null, changes: {}, remove: false };
}

function newStockEdit(create: Record<string, any>): StockEdit {
  return { row: null, create: create, changes: {}, remove: false };
}

function stockQty(edit: StockEdit, field: string): number {
  if (Object.prototype.hasOwnProperty.call(edit.changes, field)) {
    return edit.changes[field];
  }
  return parseFloat(display(edit.row && edit.row[field])) || 0;
}

function setStockQty(edit: StockEdit, field: string, value: number): void {
  edit.changes[field] = roundQty(value);
}

// The edit for `key`, starting one from `row` the first time the key is hit.
// Returns null when there's no row and `create` is null (nothing to edit).
function stockEditFor(
  edits: Map<string, StockEdit>,
  key: string,
  row: any | undefined,
  create: (() => Record<string, any> | null) | null,
): StockEdit | null {
  let edit = edits.get(key) || null;
  if (!edit) {
    if (row) edit = existingStockEdit(row);
    else {
      const fields = create && create();
      if (fields) edit = newStockEdit(fields);
    }
    if (edit) edits.set(key, edit);
  }
  return edit;
}

// Writes one edited row: a delete, an update of just the changed fields, or
// a create.
function writeStockEdit(
  edit: StockEdit,
  reportName: string,
  formName: string,
): Promise<any> {
  if (edit.row) {
    if (edit.remove) return deleteRecord(reportName, display(edit.row.ID));
    if (!Object.keys(edit.changes).length) return Promise.resolve(null);
    return updateRecord(reportName, display(edit.row.ID), edit.changes);
  }
  return addRecord(formName, { ...edit.create, ...edit.changes });
}

function writeStockEdits(
  edits: Map<string, StockEdit>,
  reportName: string,
  formName: string,
): Map<string, Promise<any>> {
  const writes = new Map<string, Promise<any>>();
  edits.forEach(function (edit, key) {
    writes.set(key, writeStockEdit(edit, reportName, formName));
  });
  return writes;
}

function groupBy(rows: any[], key: (row: any) => string): Record<string, any[]> {
  const out: Record<string, any[]> = {};
  rows.forEach(function (row) {
    const k = key(row);
    if (!k) return;
    (out[k] = out[k] || []).push(row);
  });
  return out;
}

// Zoho Creator enforces a low cap on simultaneous in-flight API calls per
// session — firing a get/update for every line of a multi-line record
// (several finished goods, several raw materials, each needing 2-3 lookups
// plus updates) via Promise.all blows past that cap and every call past it
// comes back `{ code: 2955, description: "You have reached the maximum
// number of API calls that can be simultaneously initiated at a time." }`.
// Chains each item's work with .then() instead, one request at a time.
// Every call now also goes through the request queue (zohoCall), so new
// code fires independent requests with runAll instead; this stays for the
// PO / receive line rows, which are written in the order they were entered.
function runSequentially<T, R>(
  items: T[],
  task: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  return items
    .reduce(function (chain: Promise<void>, item) {
      return chain.then(function () {
        return task(item).then(function (result) {
          results.push(result);
        });
      });
    }, Promise.resolve())
    .then(function () {
      return results;
    });
}

// Generic create — every write this widget does (MRP header, Finished_Goods
// links, Raw_Materials rows) goes through this one function.
function addRecord(formName: string, data: Record<string, any>): Promise<any> {
  return zohoData("addRecords", {
    app_name: CONFIG.APP_NAME,
    form_name: formName,
    payload: {
      data: data,
    },
  }).then(function (resp: any) {
    if (!resp || resp.code !== 3000 || !resp.data) {
      return Promise.reject(
        new Error("Failed to create a record in " + formName + "."),
      );
    }
    return resp.data;
  });
}

// Generic update — used to bump Sequence_Master's counter and to link an
// existing Finished_Goods row to the MRP that was just created for it.
//
// NOTE: the JS SDK's update call is `updateRecordById`, not `updateRecords`
// (that method doesn't exist on the SDK) — and it takes `report_name`, not
// `form_name`, same as getRecords. Confirmed against Zoho's own docs:
// https://www.zoho.com/creator/help/js-api/v2/update-specific-record.html
// Getting this wrong made every update reject before any network request
// was even sent, silently dropping the Finished_Goods MRP_ID link-back and
// the sequence bump while the rest of the create had already succeeded.
function updateRecord(
  reportName: string,
  recordId: string,
  data: Record<string, any>,
): Promise<any> {
  return zohoData("updateRecordById", {
    app_name: CONFIG.APP_NAME,
    report_name: reportName,
    id: recordId,
    payload: {
      data: data,
    },
  }).then(function (resp: any) {
    if (!resp || resp.code !== 3000) {
      return Promise.reject(
        new Error(
          "Failed to update record " + recordId + " in " + reportName + ".",
        ),
      );
    }
    return resp.data;
  });
}

// Generic delete — same report_name convention as updateRecord (the SDK's
// deleteRecordById call, like updateRecordById, addresses by report, not
// form). Used to remove a Batch_Details row once FEFO consumption has
// emptied it out, mirroring the native workflow's own
// "delete from Batch_Details[...]" step.
function deleteRecord(reportName: string, recordId: string): Promise<any> {
  return zohoData("deleteRecordById", {
    app_name: CONFIG.APP_NAME,
    report_name: reportName,
    id: recordId,
  }).then(function (resp: any) {
    if (!resp || resp.code !== 3000) {
      return Promise.reject(
        new Error(
          "Failed to delete record " + recordId + " in " + reportName + ".",
        ),
      );
    }
    return resp;
  });
}

// ───────────── Batch allocation PDF (Creator mobile app) ─────────────
// Creator SDK rejections arrive in several shapes — a bare string, an Error,
// or the API's own { code, description | message } body — so flatten
// whichever one shows up into a single readable line for the UI.
export function describeError(err: any): string {
  if (err == null) return "";
  if (typeof err === "string") return err;
  const text = err.description || err.message || err.error_message || "";
  const code = err.code != null ? String(err.code) : "";
  if (text || code) return (code ? code + " – " : "") + text;
  try {
    return JSON.stringify(err).slice(0, 160);
  } catch {
    return String(err);
  }
}

// A file field's value comes back as a download path whose `filepath` query
// param is the stored file's internal name — same thing uploadFile returns.
function filePathFromFieldValue(value: any): string {
  const match =
    typeof value === "string" ? value.match(/[?&]filepath=([^&]+)/) : null;
  return match ? decodeURIComponent(match[1]).replace(/^\//, "") : "";
}

function parseMaybeJson(value: any): any {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

// The upload response's exact shape isn't guaranteed by the SDK — the docs
// show { code, data: { filepath } }, but it can also be flat, a JSON string,
// or spell the key filePath/file_path — so search the whole thing for it.
function findFilePath(value: any, depth: number): string {
  if (value == null || depth > 4) return "";
  if (typeof value === "string") return filePathFromFieldValue(value);
  if (typeof value !== "object") return "";
  const keys = Object.keys(value);
  for (let i = 0; i < keys.length; i++) {
    const item = value[keys[i]];
    if (/^file_?path$/i.test(keys[i]) && typeof item === "string" && item) {
      return item.replace(/^\//, "");
    }
  }
  for (let i = 0; i < keys.length; i++) {
    const found = findFilePath(value[keys[i]], depth + 1);
    if (found) return found;
  }
  return "";
}

// The origin Creator serves this widget (and its files) from. The widget's
// own URL carries it as ?serviceOrigin=… — the app builder's
// creator.zoho.com.au is a different host, so the config value is only a
// fallback.
function creatorServiceOrigin(): string {
  const match = window.location.search.match(/[?&]serviceOrigin=([^&]+)/);
  if (match) {
    const origin = decodeURIComponent(match[1]).replace(/\/+$/, "");
    if (
      /^https:\/\/[\w-]+(\.[\w-]+)*\.zoho\.[a-z]+(\.[a-z]+)?$/i.test(origin)
    ) {
      return origin;
    }
  }
  return CONFIG.CREATOR_ORIGIN;
}

// The SDK's uploadFile only reads `.name` off the file and hands it to
// FileReader, so a named Blob is enough where `new File()` isn't available.
function toUploadFile(blob: Blob, filename: string): File {
  try {
    return new File([blob], filename, { type: "application/pdf" });
  } catch {
    const named: any = blob;
    named.name = filename;
    return named as File;
  }
}

// Uploads the PDF into Production_Targets.Batch_Allocation_PDF. Resolves
// with the Creator URL that opens it in the signed-in session, or null when
// the file was saved but its stored path couldn't be worked out (so there's
// no URL to build). Rejects only if the upload itself failed.
//
// NOTE: the upload is an edit of the Production_Targets record, so its
// on-edit workflows run — the SDK's uploadFile has no way to skip them.
export function uploadBatchAllocationPdf(
  productionTargetRecordId: string,
  blob: Blob,
  filename: string,
): Promise<string | null> {
  // Starting from a resolved promise turns a synchronous throw (SDK missing
  // `FILE`, bad argument) into a rejection callers can handle like any other.
  return Promise.resolve()
    .then(function () {
      return window.ZOHO.CREATOR.FILE.uploadFile({
        app_name: CONFIG.APP_NAME,
        report_name: CONFIG.PRODUCTION_TARGET_REPORT,
        id: productionTargetRecordId,
        field_name: CONFIG.BATCH_ALLOCATION_PDF_FIELD,
        file: toUploadFile(blob, filename),
      });
    })
    .then(function (rawResp: any) {
      const resp = parseMaybeJson(rawResp);
      if (!resp || (resp.code != null && resp.code !== 3000)) {
        return Promise.reject(
          new Error(
            "Upload rejected" +
              (resp ? " (" + describeError(resp) + ")" : "") +
              ".",
          ),
        );
      }
      const fromResponse = findFilePath(resp, 0);
      if (fromResponse) return fromResponse;
      // Response carried no path — read it back off the record instead
      // (only works if the field is a column of the report).
      return getRecords(
        CONFIG.PRODUCTION_TARGET_REPORT,
        "ID == " + productionTargetRecordId,
        200,
      ).then(function (rows) {
        const fromRecord = rows.length
          ? filePathFromFieldValue(rows[0][CONFIG.BATCH_ALLOCATION_PDF_FIELD])
          : "";
        if (!fromRecord) {
          console.warn(
            "Batch allocation PDF was saved, but its file path wasn't found in the upload response:",
            rawResp,
          );
        }
        return fromRecord;
      });
    })
    .then(function (filePath: string) {
      if (!filePath) return null;
      return (
        creatorServiceOrigin() +
        "/file/" +
        CONFIG.ACCOUNT_OWNER +
        "/" +
        CONFIG.APP_NAME +
        "/" +
        CONFIG.PRODUCTION_TARGET_REPORT +
        "/" +
        productionTargetRecordId +
        "/" +
        CONFIG.BATCH_ALLOCATION_PDF_FIELD +
        "/download?filepath=/" +
        encodeURIComponent(filePath)
      );
    });
}

// The widget is a sandboxed iframe inside a Creator page, so it can't open
// windows or navigate the page itself — the Creator shell does it through
// navigateParentURL. Fire-and-forget: the SDK's promise may never settle
// once the shell takes over navigation.
export function openInParentWindow(url: string): void {
  const nav = window.ZOHO.CREATOR.UTIL.navigateParentURL({
    action: "open",
    url: url,
    window: "new",
  });
  if (nav && typeof nav.catch === "function") nav.catch(function () {});
}

function navigateTopOrSelf(url: string): void {
  try {
    if (window.top) {
      window.top.location.href = url;
      return;
    }
  } catch (err) {
    console.warn("window.top navigation failed, falling back:", err);
  }
  window.location.href = url;
}

// Navigates the Creator page hosting this widget to `url` (same window).
// Goes through the SDK first; if that isn't available, throws, or rejects,
// falls back to window.top and finally to the widget's own window.
//
// NOTE: navigateParentURL takes a config object, not a URL string — passed
// a string it rejects with "Improper Configuration..!!" without navigating.
export function navigateParentTo(url: string): void {
  try {
    const util = window.ZOHO && window.ZOHO.CREATOR && window.ZOHO.CREATOR.UTIL;
    if (util && typeof util.navigateParentURL === "function") {
      const nav = util.navigateParentURL({
        action: "open",
        url: url,
        window: "same",
      });
      if (nav && typeof nav.catch === "function") {
        nav.catch(function (err: any) {
          console.warn("navigateParentURL rejected, falling back:", err);
          navigateTopOrSelf(url);
        });
      }
      return;
    }
  } catch (err) {
    console.warn("navigateParentURL failed, falling back:", err);
  }
  navigateTopOrSelf(url);
}

// The header's Back button returns to the Production Targets list, which is
// where this widget's page is opened from.
export function goBackToProductionTargets(): void {
  navigateParentTo(
    creatorServiceOrigin() +
      "/" +
      CONFIG.ACCOUNT_OWNER +
      "/" +
      CONFIG.APP_NAME +
      "#Report:" +
      CONFIG.PRODUCTION_TARGET_REPORT,
  );
}

// ───────────── Production Target ─────────────
function mapProductionTargetRow(r: any): ProductionTargetRow {
  return {
    id: r.ID,
    productionTargetId: display(r.Production_Target_ID),
    date: display(r.Date_field),
    assignedTo: display(r.Assigned_To),
    assignedToId: lookupId(r.Assigned_To),
    startDate: display(r.Start_Date),
    endDate: display(r.End_Date),
    status: display(r.Status) as ProductionTargetRow["status"],
    notes: display(r.Notes),
  };
}

// The widget's own "open_production_over_v1" click action passes the
// display Production_Target_ID (e.g. "PT-118"), but several of the app's
// other status-filtered report pages (Ready For Production, Production
// Inprogress, Completed Production Target, Planned Production Target) wire
// their "Open Production Overview" click action to input.ID instead — the
// row's raw Zoho record ID (e.g. 3150000000047136). Both land here as the
// same production_target_id widget param, so detect which one we got:
// all-digits means it's the raw record ID (matched unquoted, per Creator's
// numeric-ID criteria rule), anything else is the display ID (a text
// field, so quoted).
export function fetchProductionTarget(
  productionTargetId: string,
): Promise<ProductionTargetRow | null> {
  const trimmedId = productionTargetId.trim();
  const isRecordId = /^\d+$/.test(trimmedId);
  const criteria = isRecordId
    ? `ID == ${trimmedId}`
    : `Production_Target_ID == "${trimmedId}"`;
  return getRecords(CONFIG.PRODUCTION_TARGET_REPORT, criteria).then(
    function (rows) {
      if (rows.length) return mapProductionTargetRow(rows[0]);
      if (!isRecordId) return null;

      // The "Waiting for Stock" report page is built on
      // Material_Requirement_Planning (filtered to Production_Target.Status
      // == "Waiting for Stock"), not on Production_Targets — its click
      // action passes that MRP row's own ID, which will never match a
      // Production_Targets row. Retry treating the ID as an MRP record and
      // follow its Production_Target lookup to the real target.
      return getRecords(CONFIG.MRP_REPORT, `ID == ${trimmedId}`).then(
        function (mrpRows) {
          if (!mrpRows.length) return null;
          const targetRecordId = lookupId(mrpRows[0].Production_Target);
          if (!targetRecordId) return null;
          return getRecords(
            CONFIG.PRODUCTION_TARGET_REPORT,
            `ID == ${targetRecordId}`,
          ).then(function (targetRows) {
            return targetRows.length
              ? mapProductionTargetRow(targetRows[0])
              : null;
          });
        },
      );
    },
  );
}

// ───────────── Material Requirement & Planning ─────────────
// NOTE: Material_Requirement_Planning.Production_Target is a lookup field.
// Creator's criteria engine matches lookups by the linked record's NUMERIC ID,
// NOT by display text — `Production_Target == "PT-118"` always returns 0 rows.
// Pass productionTargetRecordId (the numeric record ID from Production_Target)
// and match without quotes, same as fetchFinishedGoodsForTarget.
export function fetchMrpRecord(
  productionTargetRecordId: string,
): Promise<MrpRow | null> {
  const criteria = `Production_Target == ${productionTargetRecordId}`;
  return getRecords(CONFIG.MRP_REPORT, criteria).then(function (rows) {
    if (!rows.length) return null;
    const r = rows[0];
    return {
      id: r.ID,
      mrpId: display(r.MRP_ID),
      productionTargetId: display(r.Production_Target),
      // MRP_Date per the app's .ds export — Material_Requirement_Planning
      // has no Date_field. Status here is just "False"/"True" (unrelated to
      // stock — see MrpRow.status) — the procurement-required signal lives
      // on Production_Targets.Status instead.
      date: display(r.MRP_Date),
      createdBy: display(r.Created_By45657),
      notes: display(r.Notes),
      status: display(r.Status) as any,
    };
  });
}

// ───────────── Procurement (Non_Stock_Items → Purchase Order → Purchase Receive) ─────────────
// NOTE: the previous version of this file matched Purchase_Order/
// Purchase_Receive against a `Production_Target_ID` field that doesn't
// exist on either form (confirmed against the .ds export) — every read
// here silently returned zero rows, which is why the Procurement tab only
// ever showed plain status text. Purchase_Order only relates to a
// Production Target indirectly, via its MRP_ID lookup, so everything below
// is keyed off the MRP's own record ID instead.

// Shortfall raw materials still needing a PO (or already covered by one) —
// backs the "Needed Items" selection list in the Procurement tab.
export function fetchNonStockItemsForMrp(
  mrpRecordId: string,
): Promise<NonStockItemRow[]> {
  if (!mrpRecordId) return Promise.resolve([]);
  const criteria = `MRP_ID == ${mrpRecordId}`;
  return getRecords(CONFIG.NON_STOCK_ITEMS_REPORT, criteria).then(
    function (rows) {
      return rows.map(function (r: any) {
        return {
          id: display(r.ID),
          productId: lookupId(r.Product),
          productName: display(r.Product),
          uomId: lookupId(r.UOM),
          uomName: display(r.UOM),
          stockOnHand: parseFloat(display(r.Stock_On_Hand)) || 0,
          stockRequired: parseFloat(display(r.Stock_Required)) || 0,
          allocateQuantity: parseFloat(display(r.Allocate_Quantity)) || 0,
          neededQuantity: parseFloat(display(r.Needed_Quantity)) || 0,
          status: (display(r.Status) ||
            "Needs Purchase") as NonStockItemRow["status"],
        };
      });
    },
  );
}

let suppliersPromise: Promise<SupplierOption[]> | null = null;
let paymentTermsPromise: Promise<PaymentTermOption[]> | null = null;
let taxTypesPromise: Promise<TaxOption[]> | null = null;
let employeesPromise: Promise<EmployeeOption[]> | null = null;

export function fetchSuppliers(): Promise<SupplierOption[]> {
  if (!suppliersPromise) {
    suppliersPromise = getRecords(CONFIG.SUPPLIER_REPORT)
      .then(function (rows) {
        return rows.map(function (r: any) {
          return {
            id: display(r.ID),
            name:
              formatEmployeeName(r.Supplier_Name) ||
              display(r.Supplier_Code) ||
              "Unnamed",
          };
        });
      })
      .catch(function (error) {
        suppliersPromise = null;
        throw error;
      });
  }
  return suppliersPromise;
}

export function fetchPaymentTerms(): Promise<PaymentTermOption[]> {
  if (!paymentTermsPromise) {
    paymentTermsPromise = getRecords(CONFIG.PAYMENT_TERM_REPORT)
      .then(function (rows) {
        return rows.map(function (r: any) {
          return {
            id: display(r.ID),
            name: display(r.Payment_Terms),
          };
        });
      })
      .catch(function (error) {
        paymentTermsPromise = null;
        throw error;
      });
  }
  return paymentTermsPromise;
}

export function fetchTaxTypes(): Promise<TaxOption[]> {
  if (!taxTypesPromise) {
    taxTypesPromise = getRecords(CONFIG.TAX_MASTER_REPORT, `Status == "Active"`)
      .then(function (rows) {
        return rows.map(function (r: any) {
          return {
            id: display(r.ID),
            name: display(r.Tax_Name),
            rate: parseFloat(display(r.Tax_Rate)) || 0,
          };
        });
      })
      .catch(function (error) {
        taxTypesPromise = null;
        throw error;
      });
  }
  return taxTypesPromise;
}

// ───────────── Create Purchase Order: draft → commit ─────────────

function generatePoNumber(sequenceRow: any): string {
  const prefix = display(sequenceRow.Purchase_Name);
  const currentNo = parseInt(display(sequenceRow.Purchase_No), 10) || 0;
  return prefix + String(currentNo).padStart(3, "0");
}

function bumpPoSequence(
  sequenceRowId: string,
  currentPurchaseNo: number,
): Promise<any> {
  return updateRecord(CONFIG.SEQUENCE_MASTER_REPORT, sequenceRowId, {
    Purchase_No: currentPurchaseNo + 1,
  });
}

// Computes the draft; writes nothing to Zoho. selectedItems are the
// Non_Stock_Items rows the user checked in the Procurement tab — Order
// Quantity defaults to Needed Quantity (editable), Unit Price starts at 0
// (must have a value before submit, mirroring the native form's own
// "must have Unit_Price" rule).
export function prepareCreatePoDraft(
  mrpRecordId: string,
  selectedItems: NonStockItemRow[],
): Promise<CreatePoDraft> {
  if (!selectedItems.length) {
    return Promise.reject(
      new Error("Select at least one item to create a Purchase Order."),
    );
  }
  return fetchSequenceMasterRow().then(function (sequenceRow) {
    return {
      poNumber: generatePoNumber(sequenceRow),
      poDate: new Date().toISOString().slice(0, 10),
      mrpRecordId: mrpRecordId,
      supplierId: "",
      paymentTermsId: "",
      expectedDeliveryDate: "",
      lines: selectedItems.map(function (item) {
        return {
          nonStockItemId: item.id,
          productId: item.productId,
          productName: item.productName,
          uomId: item.uomId,
          uomName: item.uomName,
          neededQuantity: item.neededQuantity,
          orderQuantity: item.neededQuantity,
          unitPrice: 0,
          taxTypeId: "",
          taxPercentage: 0,
        };
      }),
      sequenceRowId: sequenceRow.ID,
      sequencePurchaseNo: parseInt(display(sequenceRow.Purchase_No), 10) || 0,
    };
  });
}

// Writes a confirmed draft: the Purchase_Order header, its PO_Line_Items
// rows, bumps the sequence, and flips each covered Non_Stock_Items row to
// "PO Created" — mirroring the native "Generate Purchase Order ID" /
// "Po update in Inventory" workflows (minus the Zoho Inventory sync call,
// which is out of scope — same boundary as every other zoho.inventory.*
// call in this app).
export function commitCreatePo(
  draft: CreatePoDraft,
): Promise<{ poRecordId: string; poNumber: string }> {
  // Mirrors the native line-item workflows (Calculate Unit Price / Get Tax
  // Amount): Line_Total is pre-tax (Order Qty × Unit Price), Tax_Amount is
  // Line_Total × Tax_Percentage / 100, and the header's Sub_Total/Tax_Amount/
  // Grand_Total are just the sums of those across every line.
  const computedLines = draft.lines.map(function (line) {
    const lineTotal = roundMoney(line.orderQuantity * line.unitPrice);
    const taxAmount = roundMoney((lineTotal * line.taxPercentage) / 100);
    return { line: line, lineTotal: lineTotal, taxAmount: taxAmount };
  });
  const subTotal = roundMoney(
    computedLines.reduce(function (sum, l) {
      return sum + l.lineTotal;
    }, 0),
  );
  const taxTotal = roundMoney(
    computedLines.reduce(function (sum, l) {
      return sum + l.taxAmount;
    }, 0),
  );
  const grandTotal = roundMoney(subTotal + taxTotal);

  const lineRows = computedLines.map(function (entry) {
    const line = entry.line;
    const row: Record<string, any> = {
      Product: line.productId,
      UOM: line.uomId,
      Needed_Quantity: line.neededQuantity,
      Order_Qty: line.orderQuantity,
      Unit_Price: roundMoney(line.unitPrice),
      Line_Total: entry.lineTotal,
      Tax_Percentage: roundQty(line.taxPercentage),
      Tax_Amount: entry.taxAmount,
    };
    if (line.taxTypeId) row.Tax_Type = line.taxTypeId;
    return row;
  });
  // With the subform's link name set in CONFIG, the lines go inline in the
  // header's own payload — one request, lines kept in entry order.
  const subform = CONFIG.PO_LINE_ITEMS_SUBFORM;
  const header: Record<string, any> = {
    PO_Number: draft.poNumber,
    PO_Date: formatDateStringForZoho(draft.poDate),
    MRP_ID: draft.mrpRecordId,
    Supplier_Name: draft.supplierId,
    Payment_Terms: draft.paymentTermsId,
    Expected_Delivery_Date: formatDateStringForZoho(draft.expectedDeliveryDate),
    Status: "Not Received",
  };
  if (subform && lineRows.length) header[subform] = lineRows;

  return addRecord(CONFIG.PURCHASE_ORDER_FORM, header).then(
    function (poRecord) {
      const poRecordId: string = display(poRecord.ID);
      if (!poRecordId) {
        // Guards against ever silently writing PO_Line_Items rows with a
        // blank PO_Number lookup — better to fail the whole commit loudly
        // here than leave orphaned lines nothing in the UI can find later.
        return Promise.reject(
          new Error(
            "Purchase Order was created but its record ID couldn't be resolved — no line items were written.",
          ),
        );
      }

      // Separate line rows stay one at a time, so they're created in the
      // order they were entered — that's the order Books shows them in.
      const linesPromise = subform
        ? Promise.resolve([])
        : runSequentially(lineRows, function (row) {
            return addRecord(CONFIG.PO_LINE_ITEMS_FORM, {
              PO_Number: poRecordId,
              ...row,
            });
          });
      return linesPromise
        .then(function () {
          // The Non_Stock_Items status flips and the header totals are
          // independent of each other, so they're written together.
          return Promise.all([
            runAll(draft.lines, function (line) {
              return updateRecord(
                CONFIG.NON_STOCK_ITEMS_REPORT,
                line.nonStockItemId,
                {
                  Status: "PO Created",
                },
              );
            }),
            updateRecord(CONFIG.PURCHASE_ORDER_REPORT, poRecordId, {
              Sub_Total: subTotal,
              Tax_Amount: taxTotal,
              Grand_Total: grandTotal,
            }),
          ]);
        })
        .then(function () {
          return bumpPoSequence(draft.sequenceRowId, draft.sequencePurchaseNo);
        })
        .then(function () {
          // Books sync is best-effort (a failure is only logged) and the
          // Creator records are complete by now, so the save doesn't wait for
          // it — it finishes in the background.
          syncPurchaseOrderToBooks(poRecordId, draft.supplierId).catch(
            function (err: any) {
              console.warn(
                "Books PO sync failed (Purchase Order still created in Creator):",
                err,
              );
            },
          );
          return { poRecordId: poRecordId, poNumber: draft.poNumber };
        });
    },
  );
}

// ───────────── Read Purchase Orders (+ line items) for an MRP ─────────────

// Derives the PO's real status from its own lines instead of trusting
// Purchase_Order.Status verbatim — that field is only as good as whatever
// Deluge function last touched it, and has been seen stuck on "Partially
// Received" for a fully-received PO (a stale/incorrectly-scoped rollup on
// the Deluge side). Every line's orderQuantity/receivedQuantity is already
// being fetched here anyway, so this is a free, always-correct fallback.
function derivePoStatus(lines: PoLineRow[]): string {
  if (!lines.length) return "Not Received";
  const EPSILON = 0.0001;
  const anyReceived = lines.some(function (l) {
    return l.receivedQuantity > EPSILON;
  });
  const allFullyReceived = lines.every(function (l) {
    return l.receivedQuantity >= l.orderQuantity - EPSILON;
  });
  if (allFullyReceived) return "Received";
  if (anyReceived) return "Partially Received";
  return "Not Received";
}

export function fetchPurchaseOrdersForMrp(
  mrpRecordId: string,
): Promise<PurchaseOrderDetail[]> {
  if (!mrpRecordId) return Promise.resolve([]);
  const criteria = `MRP_ID == ${mrpRecordId}`;
  return getRecords(CONFIG.PURCHASE_ORDER_REPORT, criteria).then(
    function (rows) {
      // Every PO's lines in one batched read, grouped back by PO.
      return getRecordsByIds(
        CONFIG.PO_LINE_ITEMS_REPORT,
        "PO_Number",
        rows.map(function (r: any) {
          return display(r.ID);
        }),
      ).then(function (allLines) {
        const linesByPo = groupBy(allLines, function (line: any) {
          return lookupId(line.PO_Number);
        });
        return rows.map(function (r: any) {
          const poId = display(r.ID);
          const lineRows = linesByPo[poId] || [];
          const lines: PoLineRow[] = lineRows.map(function (line: any) {
            return {
              id: display(line.ID),
              productId: lookupId(line.Product),
              productName: display(line.Product),
              uomName: display(line.UOM),
              orderQuantity: parseFloat(display(line.Order_Qty)) || 0,
              receivedQuantity: parseFloat(display(line.Received_Qty)) || 0,
              unitPrice: parseFloat(display(line.Unit_Price)) || 0,
              taxPercentage: parseFloat(display(line.Tax_Percentage)) || 0,
              taxAmount: parseFloat(display(line.Tax_Amount)) || 0,
              lineTotal: parseFloat(display(line.Line_Total)) || 0,
            };
          });
          return {
            id: poId,
            poNumber: display(r.PO_Number),
            poDate: display(r.PO_Date),
            mrpRecordId: mrpRecordId,
            supplierId: lookupId(r.Supplier_Name),
            supplierName:
              formatEmployeeName(r.Supplier_Name) || display(r.Supplier_Name),
            status: derivePoStatus(lines),
            subTotal: parseFloat(display(r.Sub_Total)) || 0,
            taxAmount: parseFloat(display(r.Tax_Amount)) || 0,
            grandTotal: parseFloat(display(r.Grand_Total)) || 0,
            lines: lines,
          };
        });
      }).then(function (details: PurchaseOrderDetail[]) {
        return details.sort(function (a, b) {
          return a.poDate < b.poDate ? 1 : -1;
        });
      });
    },
  );
}

// ───────────── Receive Purchase Order: draft → commit ─────────────

function generateReceiveNo(sequenceRow: any): string {
  const prefix = display(sequenceRow.Receive_Name);
  const currentNo = parseInt(display(sequenceRow.Receive_No), 10) || 0;
  return prefix + String(currentNo).padStart(3, "0");
}

function bumpReceiveSequence(
  sequenceRowId: string,
  currentReceiveNo: number,
): Promise<any> {
  return updateRecord(CONFIG.SEQUENCE_MASTER_REPORT, sequenceRowId, {
    Receive_No: currentReceiveNo + 1,
  });
}

// Only lines with Pending Qty > 0 are included — Receivable Qty defaults
// to the full pending amount (editable down for a partial receipt).
export function prepareReceivePoDraft(
  po: PurchaseOrderDetail,
): Promise<ReceivePoDraft> {
  const pendingLines = po.lines.filter(function (line) {
    return line.orderQuantity - line.receivedQuantity > 0;
  });
  if (!pendingLines.length) {
    return Promise.reject(
      new Error("Every line on this Purchase Order has already been received."),
    );
  }

  return Promise.all([
    fetchSequenceMasterRow(),
    fetchDefaultWarehouseId(),
  ]).then(function (results) {
    const sequenceRow = results[0];
    const warehouseId = results[1];

    return {
      receiveNo: generateReceiveNo(sequenceRow),
      receiveDate: new Date().toISOString().slice(0, 10),
      purchaseOrderRecordId: po.id,
      supplierId: po.supplierId,
      warehouseId: warehouseId,
      lines: pendingLines.map(function (line) {
        const pending = roundQty(line.orderQuantity - line.receivedQuantity);
        return {
          poLineId: line.id,
          productId: line.productId,
          productName: line.productName,
          uomId: "", // resolved just before commit, see commitReceivePo
          uomName: line.uomName,
          orderedQuantity: line.orderQuantity,
          receivedQuantitySoFar: line.receivedQuantity,
          pendingQuantity: pending,
          receivableQuantity: pending,
          batchNo: "", // required on Receive_Items — filled in by the user in the dialog
          expiryDate: "",
        };
      }),
      sequenceRowId: sequenceRow.ID,
      sequenceReceiveNo: parseInt(display(sequenceRow.Receive_No), 10) || 0,
    };
  });
}

// Writes a confirmed draft: the Purchase_Receive header, its Receive_Items
// rows, bumps the sequence, then calls the "ProcessPurchaseReceive" Custom
// API — mirroring the native "Update Received Qty to PO" / "Refresh MRP
// After PR" workflows (bumping PO_Line_Items.Received_Qty, warehouse
// Stock_On_Hand, re-allocating the MRP's Raw_Materials, and rolling the PO/
// MRP/Production Target statuses up) — all of that is genuinely
// interdependent multi-record math, so it runs server-side in one call
// rather than being replicated client-side (same reasoning as
// allocate_Stock_On_Production_Start and UpdateWarehouse).
export function commitReceivePo(draft: ReceivePoDraft): Promise<any> {
  // Only the lines the user actually selected/left quantity on go to the
  // server — a line left at 0 wasn't received this round, so it shouldn't
  // get a Receive_Items row (or the phantom Batch_Details entry
  // ProcessPurchaseReceive would otherwise create for it).
  const selectedLines = draft.lines.filter(
    (line) => line.receivableQuantity > 0,
  );
  // UOM lookups are cached per UOM text, so lines sharing a UOM share one
  // read; they run alongside the header write unless the lines go inline.
  const rowsPromise = runAll(selectedLines, function (line) {
    return resolveUomMasterId(line.uomName).then(function (uomMasterId) {
      return {
        Product_Name: line.productId,
        UOM: uomMasterId,
        Ordered_Qty: line.orderedQuantity,
        Received_Qty: line.receivedQuantitySoFar,
        Receivable_Qty: line.receivableQuantity,
        Pending_Qty: roundQty(line.pendingQuantity - line.receivableQuantity),
        // Both mandatory on Receive_Items now — ProcessPurchaseReceive
        // (UpdatePR) reads them straight off each line to create/update
        // the matching Batch_Details row for whatever just arrived.
        Batch_No: line.batchNo,
        Expiry_Date: formatDateStringForZoho(line.expiryDate),
      } as Record<string, any>;
    });
  });
  // With the subform's link name set in CONFIG, the lines go inline in the
  // header's own payload — one request, lines kept in entry order.
  const subform = CONFIG.RECEIVE_ITEMS_SUBFORM;
  const header: Record<string, any> = {
    Receive_No: draft.receiveNo,
    Purchase_Order_No: draft.purchaseOrderRecordId,
    Receive_Date: formatDateStringForZoho(draft.receiveDate),
    Supplier: draft.supplierId,
    Warehouse: draft.warehouseId,
  };
  const headerPromise = subform
    ? rowsPromise.then(function (rows) {
        if (rows.length) header[subform] = rows;
        return addRecord(CONFIG.PURCHASE_RECEIVE_FORM, header);
      })
    : addRecord(CONFIG.PURCHASE_RECEIVE_FORM, header);

  return headerPromise.then(function (receiveRecord) {
    const receiveRecordId: string = display(receiveRecord.ID);

    return rowsPromise
      .then(function (rows) {
        if (subform) return [];
        // One at a time, so they're created in the order they were
        // entered — that's the order Books shows them in.
        return runSequentially(rows, function (row) {
          return addRecord(CONFIG.RECEIVE_ITEMS_FORM, {
            Receive_No: receiveRecordId,
            ...row,
          });
        });
      })
      .then(function () {
        return bumpReceiveSequence(
          draft.sequenceRowId,
          draft.sequenceReceiveNo,
        );
      })
      .then(function () {
        return processPurchaseReceive(receiveRecordId);
      })
      .then(function (result) {
        // Best-effort, like the PO sync — finishes in the background.
        syncPurchaseReceiveToBooks(receiveRecordId, draft.supplierId).catch(
          function (err: any) {
            console.warn(
              "Books PR sync failed (Purchase Receive still recorded in Creator):",
              err,
            );
          },
        );
        return result;
      });
  });
}

// Published as "UpdatePR" in Microservices (function: ProcessPurchaseReceive).
const PROCESS_PURCHASE_RECEIVE_API = {
  api_name: "UpdatePR",
  workspace_name: "info_divinafoodco",
  public_key: "dq5NsNjaEPBpSQ4z9fgH9mp7x",
};

function processPurchaseReceive(receiveRecordId: string): Promise<any> {
  if (!PROCESS_PURCHASE_RECEIVE_API.public_key) {
    return Promise.reject(
      new Error(
        "ProcessPurchaseReceive Custom API isn't wired up yet — the receipt was recorded, but stock/MRP status won't update until this is configured.",
      ),
    );
  }
  return zohoData("invokeCustomApi", {
    api_name: PROCESS_PURCHASE_RECEIVE_API.api_name,
    workspace_name: PROCESS_PURCHASE_RECEIVE_API.workspace_name,
    http_method: "POST",
    content_type: "application/json",
    payload: {
      receive_id: receiveRecordId,
    },
    public_key: PROCESS_PURCHASE_RECEIVE_API.public_key,
  }).then(function (resp: any) {
    const result = resp && resp.result;
    if (
      !resp ||
      resp.code !== 3000 ||
      (result && result.status && result.status !== "success")
    ) {
      return Promise.reject(
        new Error(
          (result && result.message) ||
            "Failed to process the purchase receive.",
        ),
      );
    }
    return resp;
  });
}

// ───────────── Books sync (Purchase Order / Purchase Receive) ─────────────
// Best-effort: Creator is the source of truth for the PO/PR workflow itself,
// so a Books sync failure never rejects commitCreatePo/commitReceivePo —
// callers just get the record they asked for either way. Errors are logged
// so they're visible without blocking the user on an integration that's
// still being hardened (tax fields, purchasereceives payload format, etc.).
// The saves start the sync once the Creator records are complete and return
// without waiting for it.

// Published as "syncPO" in Microservices (function: PO.SyncCreatorToBooks).
const SYNC_PO_TO_BOOKS_API = {
  api_name: "syncPO",
  workspace_name: "info_divinafoodco",
  public_key: "rWapybq1J9GCpXkDeXHQ8NBwz",
};

export function syncPurchaseOrderToBooks(
  purchaseOrderRecordId: string,
  supplierRecordId: string,
): Promise<any> {
  return zohoData("invokeCustomApi", {
    api_name: SYNC_PO_TO_BOOKS_API.api_name,
    workspace_name: SYNC_PO_TO_BOOKS_API.workspace_name,
    http_method: "POST",
    content_type: "application/json",
    payload: {
      purchase_id: purchaseOrderRecordId,
      supplier_id: supplierRecordId,
    },
    public_key: SYNC_PO_TO_BOOKS_API.public_key,
  }).then(function (resp: any) {
    const result = resp && resp.result;
    // Checked against result.code (set on every branch of PO.SyncCreatorToBooks,
    // success or failure) rather than result.status, which is only ever set
    // on the success branch and would silently miss every error response.
    if (!resp || resp.code !== 3000 || !result || result.code !== 3000) {
      return Promise.reject(
        new Error(
          (result && result.message) ||
            "Failed to sync Purchase Order to Books.",
        ),
      );
    }
    return result;
  });
}

// Published as "syncPR" in Microservices (function: PR.SyncCreatorToBooks).
const SYNC_PR_TO_BOOKS_API = {
  api_name: "syncPR",
  workspace_name: "info_divinafoodco",
  public_key: "U7eygp4uRCBx6jWMB0Aa2KN9C",
};

export function syncPurchaseReceiveToBooks(
  receiveRecordId: string,
  supplierRecordId: string,
): Promise<any> {
  return zohoData("invokeCustomApi", {
    api_name: SYNC_PR_TO_BOOKS_API.api_name,
    workspace_name: SYNC_PR_TO_BOOKS_API.workspace_name,
    http_method: "POST",
    content_type: "application/json",
    payload: {
      receive_id: receiveRecordId,
      supplier_id: supplierRecordId,
    },
    public_key: SYNC_PR_TO_BOOKS_API.public_key,
  }).then(function (resp: any) {
    const result = resp && resp.result;
    if (!resp || resp.code !== 3000 || !result || result.code !== 3000) {
      return Promise.reject(
        new Error(
          (result && result.message) ||
            "Failed to sync Purchase Receive to Books.",
        ),
      );
    }
    return result;
  });
}

// Published as "fgTransfer" in Microservices (function: CreateInventoryAdjustment).
const CREATE_INVENTORY_ADJUSTMENT_API = {
  api_name: "fgTransfer",
  workspace_name: "info_divinafoodco",
  public_key: "sgurApYWw5OZUwdY8KDBxXd8J",
};

function createInventoryAdjustment(
  itemBooksId: string,
  quantityAdjusted: number,
  reason: string,
  adjDate: string,
): Promise<any> {
  console.info("Creating Inventory adjustment:", {
    item_id: itemBooksId,
    quantity_adjusted: quantityAdjusted,
    reason: reason,
    adj_date: adjDate,
  });
  return zohoData("invokeCustomApi", {
    api_name: CREATE_INVENTORY_ADJUSTMENT_API.api_name,
    workspace_name: CREATE_INVENTORY_ADJUSTMENT_API.workspace_name,
    http_method: "POST",
    content_type: "application/json",
    payload: {
      item_id: itemBooksId,
      quantity_adjusted: quantityAdjusted,
      reason: reason,
      adj_date: adjDate,
    },
    public_key: CREATE_INVENTORY_ADJUSTMENT_API.public_key,
  }).then(function (resp: any) {
    console.info("Inventory adjustment response:", resp);
    const result = resp && resp.result;
    if (!resp || resp.code !== 3000 || !result || result.code !== 3000) {
      return Promise.reject(
        new Error(
          (result && result.message) ||
            "Failed to create inventory adjustment.",
        ),
      );
    }
    return result;
  });
}

// Published as "fgScrapTransfer" in Microservices
// (function: CreateInventoryAdjustmentScrap).
const CREATE_FINISHED_GOOD_SCRAP_ADJUSTMENT_API = {
  api_name: "fgScrapTransfer",
  workspace_name: "info_divinafoodco",
  public_key: "Ovj4ZUgZ2CZMUfd4OVujhS06a",
};

function createFinishedGoodScrapInventoryAdjustment(
  itemBooksId: string,
  quantityAdjusted: number,
  reason: string,
  adjDate: string,
): Promise<any> {
  console.info("Creating finished-good scrap Inventory adjustment:", {
    item_id: itemBooksId,
    quantity_adjusted: quantityAdjusted,
    reason: reason,
    adj_date: adjDate,
  });
  return zohoData("invokeCustomApi", {
    api_name: CREATE_FINISHED_GOOD_SCRAP_ADJUSTMENT_API.api_name,
    workspace_name: CREATE_FINISHED_GOOD_SCRAP_ADJUSTMENT_API.workspace_name,
    http_method: "POST",
    content_type: "application/json",
    payload: {
      item_id: itemBooksId,
      quantity_adjusted: quantityAdjusted,
      reason: reason,
      adj_date: adjDate,
    },
    public_key: CREATE_FINISHED_GOOD_SCRAP_ADJUSTMENT_API.public_key,
  }).then(function (resp: any) {
    console.info("Finished-good scrap Inventory adjustment response:", resp);
    const result = resp && resp.result;
    if (!resp || resp.code !== 3000 || !result || result.code !== 3000) {
      return Promise.reject(
        new Error(
          (result && result.message) ||
            "Failed to create finished-good scrap inventory adjustment.",
        ),
      );
    }
    return result;
  });
}

// Published as "consumptionforraw" in Microservices
// (function: updateWarehouse.createInventoryAdjustmentForConsumption).
// Posts every raw-material line of a Consumption Entry to Books in one
// shot: Allocated_Quantity decreases Production Warehouse, Scrap_Quantity
// increases Scrap Warehouse. This used to only run as a native Creator
// "on submit" workflow on Consumption_Entry — which never fires for
// records the widget creates via the SDK — so it has to be called
// explicitly from here instead.
const CREATE_CONSUMPTION_INVENTORY_ADJUSTMENT_API = {
  api_name: "consumptionforraw",
  workspace_name: "info_divinafoodco",
  public_key: "zSugPAUg93MUHamzXhn9Y3vbX",
};

function createInventoryAdjustmentForRawMaterialConsumption(
  consumptionId: string,
): Promise<any> {
  console.info(
    "Posting raw-material consumption/scrap to Books:",
    consumptionId,
  );
  return zohoData("invokeCustomApi", {
    api_name: CREATE_CONSUMPTION_INVENTORY_ADJUSTMENT_API.api_name,
    workspace_name: CREATE_CONSUMPTION_INVENTORY_ADJUSTMENT_API.workspace_name,
    http_method: "POST",
    content_type: "application/json",
    payload: {
      consumption_id: consumptionId,
    },
    public_key: CREATE_CONSUMPTION_INVENTORY_ADJUSTMENT_API.public_key,
  }).then(function (resp: any) {
    console.info("Raw-material consumption Books response:", resp);
    const result = resp && resp.result;
    if (!result) {
      return Promise.reject(
        new Error("No response from consumptionforraw Custom API."),
      );
    }
    if (result.status === "skipped") {
      // Nothing had a valid Books item_id / positive quantity to post —
      // not a failure, just nothing to do for this entry.
      return result;
    }
    // The Deluge function catches its own Books call failures internally
    // and always resolves with status "done" — a per-line failure (e.g.
    // insufficient stock) only shows up buried inside bookResponse, so it
    // has to be checked explicitly or it silently disappears.
    const bookResponse = result.bookResponse || {};
    const failures: string[] = [];
    ["consumed", "scrap"].forEach(function (key) {
      const sub = bookResponse[key];
      if (sub && sub.code) {
        failures.push(key + ": " + (sub.message || "unknown error"));
      }
    });
    if (failures.length > 0) {
      return Promise.reject(
        new Error(
          "Books raw-material adjustment failed — " + failures.join("; "),
        ),
      );
    }
    return result;
  });
}

// Published as "Check_stock_in_MRP" in Microservices (function: MRP.CheckStock).
// Re-checks every still-short Raw_Materials row on an MRP against the
// warehouse's current Available_Stocks, reserves whatever now covers it,
// and releases the linked Production Target once nothing is left short —
// the "Check Stock" button's whole job.
const CHECK_STOCK_API = {
  api_name: "Check_stock_in_MRP",
  workspace_name: "info_divinafoodco",
  public_key: "GXgPnYWkkv6Bs7QO2APnChuUn",
};

export function checkStockForMrp(mrpRecordId: string): Promise<any> {
  return zohoData("invokeCustomApi", {
    api_name: CHECK_STOCK_API.api_name,
    workspace_name: CHECK_STOCK_API.workspace_name,
    http_method: "POST",
    content_type: "application/json",
    payload: {
      mrp_id: mrpRecordId,
    },
    public_key: CHECK_STOCK_API.public_key,
  }).then(function (resp: any) {
    const result = resp && resp.result;
    if (
      !resp ||
      resp.code !== 3000 ||
      (result && result.status && result.status !== "success")
    ) {
      return Promise.reject(
        new Error(
          (result && result.message) || "Failed to check stock for this MRP.",
        ),
      );
    }
    return resp;
  });
}

// ───────────── Production In-progress ─────────────
// Confirmed against the app's .ds export — this report is just
// Production_Targets filtered to Status == "In Progress"; there is no
// separate Assigned_By/Production_Status field, only the target's own
// Assigned_To/Status (the fields the "Complete Production" custom action
// column sits alongside natively).
export function fetchProductionInProgress(
  productionTargetId: string,
): Promise<ProductionInProgressRow[]> {
  const criteria = `Production_Target_ID == "${productionTargetId}"`;
  return getRecords(CONFIG.PRODUCTION_INPROGRESS_REPORT, criteria).then(
    function (rows) {
      return rows.map(function (r: any) {
        return {
          id: r.ID,
          productionTargetId: display(r.Production_Target_ID),
          date: display(r.Date_field),
          assignedBy: display(r.Assigned_To),
          productionStatus: display(r.Status),
        };
      });
    },
  );
}

// ───────────── Consumption Entry ─────────────
// Consumption_Entry.Production_Target is a lookup — match by the
// Production Target's numeric record ID, same rule as every other lookup
// criteria in this file. Each entry's two grids (Finished_Good,
// Raw_Material_Consumptions) are separate subform-backing reports
// (Finished_Goods_Cunsumptions, Consumption_Items), so they're fetched by
// criteria on their own back-reference lookup, same pattern used for the
// MRP's Finished_Goods/Raw_Materials.
export function fetchConsumptionEntries(
  productionTargetRecordId: string,
): Promise<ConsumptionEntryRow[]> {
  if (!productionTargetRecordId) return Promise.resolve([]);
  const criteria = `Production_Target == ${productionTargetRecordId}`;
  return getRecords(CONFIG.CONSUMPTION_ENTRY_REPORT, criteria)
    .then(function (rows) {
      // Both subform grids for every entry in two batched reads (one per
      // grid) instead of two per entry, then grouped back by entry. Read
      // one after the other to stay under Creator's concurrent-call cap.
      const entryIds = rows.map(function (r: any) {
        return display(r.ID);
      });
      return getRecordsByIds(
        CONFIG.FINISHED_GOODS_CONSUMPTIONS_REPORT,
        "Consumption_Entry",
        entryIds,
      ).then(function (allFinishedGoods) {
        return getRecordsByIds(
          CONFIG.CONSUMPTION_ITEMS_REPORT,
          "Consumption_ID",
          entryIds,
        ).then(function (allItems) {
          const fgByEntry = groupBy(allFinishedGoods, function (fg: any) {
            return lookupId(fg.Consumption_Entry);
          });
          const itemsByEntry = groupBy(allItems, function (rm: any) {
            return lookupId(rm.Consumption_ID);
          });
          return rows.map(function (r: any) {
          const entryId = display(r.ID);
          const sub = [fgByEntry[entryId] || [], itemsByEntry[entryId] || []];
          const finishedGoods = sub[0].map(function (fg: any) {
            return {
              id: display(fg.ID),
              itemId: lookupId(fg.Finished_Good),
              itemName: display(fg.Finished_Good),
              uom: "",
              targetQuantity: parseFloat(display(fg.Target_Quantity)) || 0,
              producedQuantity: parseFloat(display(fg.Produced_Quantity)) || 0,
              scrapQuantity: parseFloat(display(fg.Scrap_Quantity)) || 0,
              batchNo: display(fg.Batch_No),
              expiryDate: display(fg.Expiry_Date),
            };
          });
          const rawMaterials = sub[1].map(function (rm: any) {
            return {
              id: display(rm.ID),
              productId: lookupId(rm.Raw_Material),
              productName: display(rm.Raw_Material),
              uom: display(rm.UOM),
              allocatedQuantity:
                parseFloat(display(rm.Allocated_Quantity)) || 0,
              consumedQuantity: parseFloat(display(rm.Consumed_Quantity)) || 0,
              scrapQuantity: parseFloat(display(rm.Scrap_Quantity)) || 0,
            };
          });
          return {
            id: entryId,
            consumptionId: display(r.Consumption_ID),
            productionTargetId: display(r.Production_Target),
            date: display(r.Date_field),
            remarks: display(r.Remarks),
            finishedGoods: finishedGoods,
            rawMaterials: rawMaterials,
          };
          });
        });
      });
    })
    .then(function (entries: ConsumptionEntryRow[]) {
      return entries.sort(function (a, b) {
        return a.date < b.date ? 1 : -1;
      });
    });
}

// ───────────── Create MRP ─────────────

// Finished-good lines already attached to the Production Target (added when
// the target itself was created). These are what get exploded through their
// BOM below, and later get their MRP_ID set once the new MRP exists.
//
// NOTE: Finished_Goods.Production_Target_ID is a lookup field, and Creator's
// criteria engine matches lookups as NUMBER (the linked record's ID) rather
// than by display text — `Production_Target_ID == "PT-114"` throws
// "Invalid criteria specified" (code 3330) here, unlike the plain-text
// Production_Target_ID field on Production_Targets itself. So this one
// takes the Production Target's record ID, not its display ID string.
export function fetchFinishedGoodsForTarget(
  productionTargetRecordId: string,
): Promise<FinishedGoodTargetRow[]> {
  const criteria = `Production_Target_ID == ${productionTargetRecordId}`;
  return getRecords(CONFIG.FINISHED_GOODS_REPORT, criteria).then(
    function (rows) {
      // Finished_Goods exposes Item only as a Product_Master lookup, while
      // the external item ID lives on the linked Product_Master record —
      // read every finished good's product in one batched request.
      return getRecordsByIds(
        CONFIG.PRODUCT_MASTER_REPORT,
        "ID",
        rows.map(function (r: any) {
          return lookupId(r.Item);
        }),
      ).then(function (products) {
        const productById: Record<string, any> = {};
        products.forEach(function (p: any) {
          productById[display(p.ID)] = p;
        });
        return rows.map(function (r: any) {
          const itemId = lookupId(r.Item);
          const product = productById[itemId];
          return {
            id: r.ID,
            productionTargetRecordId: lookupId(r.Production_Target_ID),
            itemId: itemId,
            booksItemId: product ? display(product.Inventory_ID) : "",
            itemName: display(r.Item),
            uomId: lookupId(r.UOM),
            uomName: display(r.UOM),
            targetQuantity: parseFloat(display(r.Target_Quantity)) || 0,
          };
        });
      });
    },
  );
}

// Every finished good's BOM lines in two requests total (one BOM_Master read,
// one BOM_Items read — OR'd criteria, same trick as fetchStockOnHandBatch)
// instead of fetchBomItemsForProduct's two per finished good. Keyed by the
// Finished_Goods row's own ID, so two rows for the same item each still get
// their lines. Best-effort: the per-finished-good breakdown is a display
// nicety, so a failed read resolves to {} and the views fall back to the
// combined table rather than failing the whole overview load.
function fetchBomItemsForFinishedGoods(
  finishedGoods: FinishedGoodTargetRow[],
): Promise<Record<string, BomItemRow[]>> {
  return loadBomItemsByFinishedGood(finishedGoods).catch(function (err) {
    console.warn(
      "Couldn't load finished-good BOMs; showing combined raw materials:",
      err,
    );
    return {} as Record<string, BomItemRow[]>;
  });
}

// Same batched read, but failures propagate — for MRP creation, where a
// silently empty BOM would plan zero raw materials.
function loadBomItemsByFinishedGood(
  finishedGoods: FinishedGoodTargetRow[],
): Promise<Record<string, BomItemRow[]>> {
  const itemIds = Array.from(
    new Set(
      finishedGoods
        .map(function (fg) {
          return fg.itemId;
        })
        .filter(Boolean),
    ),
  );
  if (!itemIds.length) return Promise.resolve({});

  return getRecords(
    CONFIG.BOM_MASTER_REPORT,
    itemIds
      .map(function (id) {
        return `Product == ${id}`;
      })
      .join(" || "),
  )
    .then(function (bomRows) {
      // fetchBomItemsForProduct uses the first BOM when a product has several.
      const bomIdByItem: Record<string, string> = {};
      bomRows.forEach(function (b: any) {
        const itemId = lookupId(b.Product);
        if (itemId && !bomIdByItem[itemId]) bomIdByItem[itemId] = display(b.ID);
      });
      const bomIds = Array.from(new Set(Object.values(bomIdByItem)));
      if (!bomIds.length) return {};

      return getRecords(
        CONFIG.BOM_ITEMS_REPORT,
        bomIds
          .map(function (id) {
            return `BOM_ID == ${id}`;
          })
          .join(" || "),
      ).then(function (itemRows) {
        const itemsByBom: Record<string, BomItemRow[]> = {};
        itemRows.forEach(function (r: any) {
          const bomId = lookupId(r.BOM_ID) || display(r.BOM_ID);
          if (!bomId) return;
          (itemsByBom[bomId] = itemsByBom[bomId] || []).push({
            bomId: bomId,
            productId: lookupId(r.Product),
            productName: display(r.Product),
            quantityRequired: parseFloat(display(r.Quantity_Required)) || 0,
            uomId: lookupId(r.UOM),
            uomName: display(r.UOM),
          });
        });

        const byFinishedGood: Record<string, BomItemRow[]> = {};
        finishedGoods.forEach(function (fg) {
          const items = itemsByBom[bomIdByItem[fg.itemId]];
          if (items) byFinishedGood[fg.id] = items;
        });
        return byFinishedGood;
      });
    });
}

// Available_Stocks is the source of truth for current stock — sum it across
// every Main_Warehouse_Stock_Details row for a raw material (normally just
// one, since there's a single Main Warehouse). Batched across every raw
// material aggregated MRP needs at once: this used to be one getRecords
// round trip per product, run through runSequentially (see its comment —
// Creator's cap on simultaneous in-flight calls rules out just Promise.all-ing
// them). A production target with 6 raw materials meant 6 sequential
// ~300-500ms round trips back to back before the Create MRP draft could even
// render. A single OR'd criteria gets every product's rows in one request
// instead, with no change to what's fetched or how it's aggregated.
function fetchStockOnHandBatch(
  productIds: string[],
): Promise<Record<string, number>> {
  const uniqueIds = Array.from(new Set(productIds.filter(Boolean)));
  if (!uniqueIds.length) return Promise.resolve({});

  const criteria = uniqueIds
    .map(function (id) {
      return `Product_Master == ${id}`;
    })
    .join(" || ");

  return getRecords(CONFIG.MAIN_WAREHOUSE_STOCK_REPORT, criteria).then(
    function (rows) {
      const totals: Record<string, number> = {};
      rows.forEach(function (r: any) {
        const productId = lookupId(r.Product_Master);
        if (!productId) return;
        const available = parseFloat(display(r.Available_Stocks)) || 0;
        totals[productId] = (totals[productId] || 0) + available;
      });
      return totals;
    },
  );
}

// Explodes every finished good through its BOM × Target_Quantity, aggregates
// duplicate raw materials across multiple finished-good lines, then compares
// the aggregated requirement to current stock to work out what's short.
function computeRawMaterialNeeds(
  finishedGoods: FinishedGoodTargetRow[],
): Promise<RawMaterialNeedRow[]> {
  // Every finished good's BOM in two batched reads (BOM_Master, then
  // BOM_Items) instead of two per finished good.
  return loadBomItemsByFinishedGood(finishedGoods).then(function (bomByFg) {
    return finishedGoods.map(function (fg) {
      return (bomByFg[fg.id] || []).map(function (item) {
        return {
          productId: item.productId,
          productName: item.productName,
          uom: item.uomName,
          requiredQuantity: roundQty(item.quantityRequired * fg.targetQuantity),
        };
      });
    });
  }).then(function (perFinishedGood) {
    const aggregated = new Map<
      string,
      {
        productId: string;
        productName: string;
        uom: string;
        stockRequired: number;
      }
    >();

    perFinishedGood.forEach(function (lines) {
      lines.forEach(function (line) {
        const existing = aggregated.get(line.productId);
        if (existing) {
          existing.stockRequired = roundQty(
            existing.stockRequired + line.requiredQuantity,
          );
        } else {
          aggregated.set(line.productId, {
            productId: line.productId,
            productName: line.productName,
            uom: line.uom,
            stockRequired: line.requiredQuantity,
          });
        }
      });
    });

    const aggregatedList = Array.from(aggregated.values());

    return fetchStockOnHandBatch(
      aggregatedList.map(function (rm) {
        return rm.productId;
      }),
    ).then(function (stockByProduct) {
      return aggregatedList.map(function (rm) {
        const stockOnHand = roundQty(stockByProduct[rm.productId] || 0);
        const allocateQuantity = roundQty(
          Math.min(stockOnHand, rm.stockRequired),
        );
        const neededQuantity = roundQty(
          Math.max(0, rm.stockRequired - stockOnHand),
        );
        return {
          productId: rm.productId,
          productName: rm.productName,
          uom: rm.uom,
          stockOnHand: stockOnHand,
          stockRequired: rm.stockRequired,
          allocateQuantity: allocateQuantity,
          neededQuantity: neededQuantity,
          status: (neededQuantity > 0
            ? "Needs Purchase"
            : "Stock Available") as RawMaterialNeedRow["status"],
        };
      });
    });
  });
}

// Sequence_Master holds a single row of running counters. MRP_ID is that
// row's MRP_Name prefix + MRP_No zero-padded to 3 digits (e.g. "MRP-045"),
// mirroring the app's native Deluge "Generate MRP ID" workflow.
function fetchSequenceMasterRow(): Promise<any> {
  return getRecords(CONFIG.SEQUENCE_MASTER_REPORT).then(function (rows) {
    if (!rows.length)
      return Promise.reject(
        new Error("Sequence_Master has no row configured."),
      );
    return rows[0];
  });
}

function generateMrpId(sequenceRow: any): string {
  const prefix = display(sequenceRow.MRP_Name);
  const currentNo = parseInt(display(sequenceRow.MRP_No), 10) || 0;
  return prefix + String(currentNo).padStart(3, "0");
}

// Only call this once the full MRP create has succeeded — bumping the
// counter first would burn a sequence number on a failed/partial create.
function bumpMrpSequence(
  sequenceRowId: string,
  currentMrpNo: number,
): Promise<any> {
  return updateRecord(CONFIG.SEQUENCE_MASTER_REPORT, sequenceRowId, {
    MRP_No: currentMrpNo + 1,
  });
}

// Non_Stock_Items.UOM is a lookup to UOM_Master, but our raw-material rows
// only carry the UOM as plain text (same as the native "Generate MRP ID"
// workflow's own get_line.UOM) — resolve it the same way that workflow
// does: match UOM_Master's own UOM text field.
// Master rows (UOMs, warehouses) don't change during a session, so each
// lookup is read once and reused — saves a request per line on every
// receive / MRP commit. A failed or empty lookup isn't cached, so it's
// retried next time.
const masterCache: Record<string, Promise<any>> = {};
function cachedMaster<T>(
  key: string,
  load: () => Promise<T>,
  keep: (value: T) => boolean = function () {
    return true;
  },
): Promise<T> {
  if (!masterCache[key]) {
    masterCache[key] = load().then(
      function (value) {
        if (!keep(value)) delete masterCache[key];
        return value;
      },
      function (err) {
        delete masterCache[key];
        throw err;
      },
    );
  }
  return masterCache[key];
}

function resolveUomMasterId(uomText: string): Promise<string> {
  if (!uomText) return Promise.resolve("");
  return cachedMaster<string>(
    "uom:" + uomText,
    function () {
      return getRecords(CONFIG.UOM_MASTER_REPORT, `UOM == "${uomText}"`).then(
        function (rows) {
          return rows.length ? display(rows[0].ID) : "";
        },
      );
    },
    Boolean,
  );
}

// The "Main Warehouse" row, read once for both its record ID and its code.
function fetchMainWarehouseRow(): Promise<any | null> {
  return cachedMaster<any | null>(
    "warehouse:main",
    function () {
      return getRecords(
        CONFIG.WAREHOUSE_REPORT,
        `Warehouse_Name == "Main Warehouse"`,
      ).then(function (rows) {
        return rows.length ? rows[0] : null;
      });
    },
    Boolean,
  );
}

// The app only ever books MRPs against "Main Warehouse" — no picker needed,
// just resolve that one Warehouse_Master row's own record ID, which is what
// gets written into MRP.Warehouse (a lookup to Warehouse_Master).
function fetchDefaultWarehouseId(): Promise<string> {
  return fetchMainWarehouseRow().then(function (row) {
    if (!row) {
      return Promise.reject(
        new Error('Could not find a "Main Warehouse" row in Warehouse_Master.'),
      );
    }
    return display(row.ID);
  });
}

// Same "Main Warehouse" row as fetchDefaultWarehouseId, but its plain-text
// code (Warehouse_ID, e.g. "WH-001") instead of its record ID — needed
// alongside the record ID when creating a fresh Main_Warehouse_Stock_Details
// row (see reserveMainWarehouseStockForMrp), which stores both a lookup
// (Warehouse) and a denormalized code (Warehouse_Code), matching the native
// MRP "on add success" workflow's own insert shape.
function fetchDefaultWarehouseCode(): Promise<string> {
  return fetchMainWarehouseRow().then(function (row) {
    return row ? display(row.Warehouse_ID) : "";
  });
}

// Generic Warehouse_Master lookup by its plain-text code (Warehouse_ID field
// — e.g. "WH-001" for Main Warehouse, "WH-003" for Scrap Warehouse), matching
// the pattern used by the Deluge "on add" workflows already replicated in
// this file (Warehouse_Master[Warehouse_ID == "WH-001"] etc.) rather than by
// Warehouse_Name. Returns both the record ID (for a lookup field write) and
// the code itself (for a denormalized Warehouse_Code write), or null if no
// such warehouse row exists.
function fetchWarehouseByCode(
  code: string,
): Promise<{ id: string; code: string } | null> {
  return cachedMaster<{ id: string; code: string } | null>(
    "warehouse:" + code,
    function () {
      const criteria = `Warehouse_ID == "${code}"`;
      return getRecords(CONFIG.WAREHOUSE_REPORT, criteria).then(function (rows) {
        if (!rows.length) return null;
        return { id: display(rows[0].ID), code: display(rows[0].Warehouse_ID) };
      });
    },
    Boolean,
  );
}

function formatDateForZoho(date: Date): string {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const day = String(date.getDate()).padStart(2, "0");
  return `${day}-${months[date.getMonth()]}-${date.getFullYear()}`;
}

// Converts date strings ("YYYY-MM-DD" or standard formats) to Zoho's "DD-Mon-YYYY" format.
function formatDateStringForZoho(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3 && parts[1].length === 3 && isNaN(Number(parts[1]))) {
    return dateStr;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return formatDateForZoho(new Date(dateStr + "T00:00:00"));
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return formatDateForZoho(d);
  }
  return dateStr;
}

// ───────────── Create MRP: two-phase draft → commit ─────────────
// Phase 1 (prepareMrpDraft) computes everything a new MRP would contain —
// finished goods, BOM-exploded raw material needs, the generated MRP_ID —
// without writing anything, so the UI can show a full preview (mirroring
// the native "Generate MRP ID" form) before the user confirms. Phase 2
// (commitMrpDraft) only runs once the user clicks Create in that preview.

// Computes the draft; writes nothing to Zoho.
export function prepareMrpDraft(
  productionTargetRecordId: string,
  productionTargetId: string,
): Promise<MrpDraft> {
  // Guard against duplicate MRPs — a second attempt after a page reload (or
  // a second tab) while an earlier one was still mid-flight would otherwise
  // race the Sequence_Master read and produce two headers with the same
  // generated MRP_ID. This doesn't fully close the race (both checks can
  // still run before either commit finishes) but it catches the common case
  // where the first MRP has already landed by the time this one starts.
  // Uses productionTargetRecordId (numeric) since Production_Target is a lookup field.
  return fetchMrpRecord(productionTargetRecordId).then(function (existingMrp) {
    if (existingMrp) {
      return Promise.reject(
        new Error(
          `An MRP (${existingMrp.mrpId}) already exists for this Production Target.`,
        ),
      );
    }

    return Promise.all([
      fetchFinishedGoodsForTarget(productionTargetRecordId),
      fetchSequenceMasterRow(),
      fetchDefaultWarehouseId(),
      fetchDefaultWarehouseCode(),
    ]).then(function (results) {
      const finishedGoods = results[0];
      const sequenceRow = results[1];
      const warehouseId = results[2];
      const warehouseCode = results[3];

      if (!finishedGoods.length) {
        return Promise.reject(
          new Error(
            "This Production Target has no finished-good lines yet — add at least one before creating an MRP.",
          ),
        );
      }

      return computeRawMaterialNeeds(finishedGoods).then(
        function (rawMaterials) {
          const hasShortfall = rawMaterials.some(function (rm) {
            return rm.status === "Needs Purchase";
          });

          return {
            mrpId: generateMrpId(sequenceRow),
            mrpDate: formatDateForZoho(new Date()),
            productionTargetRecordId: productionTargetRecordId,
            productionTargetId: productionTargetId,
            warehouseId: warehouseId,
            warehouseCode: warehouseCode,
            finishedGoods: finishedGoods,
            rawMaterials: rawMaterials,
            hasShortfall: hasShortfall,
            sequenceRowId: sequenceRow.ID,
            sequenceMrpNo: parseInt(display(sequenceRow.MRP_No), 10) || 0,
          };
        },
      );
    });
  });
}

// Mirrors the Reserved_Stock loop in Material_Requirement_Planning's own
// "on add, on success" workflow: for every raw material line, bump the
// matching Main_Warehouse_Stock_Details row's Reserved_Stock by
// Allocate_Quantity and recompute Available_Stocks = Stock_On_Hand -
// Reserved_Stock, or create a fresh row (Reserved_Stock only, matching the
// native insert's own field list — it doesn't set Stock_On_Hand/
// Available_Stocks either) when this product has never had a warehouse
// stock row before. Like every other "on add" workflow in this file, this
// never fires for an MRP created via the JS SDK's addRecords, so without
// this replica an MRP created through the widget never reserves anything
// against Main Warehouse stock even though its Raw_Materials rows look
// correct.
//
// The rows are read in one batched request with a per-product re-check for
// any the batch didn't return (see fetchFirstRowByKey) — an earlier batched
// version was reverted because rows went unmatched and reservations
// silently didn't land; the re-check makes a missed row cost one extra read
// instead of a lost reservation. Every reservation is then applied in memory
// and each row written once, several at a time (see StockEdit).
function reserveMainWarehouseStockForMrp(draft: MrpDraft): Promise<void> {
  return fetchFirstRowByKey(
    CONFIG.MAIN_WAREHOUSE_STOCK_REPORT,
    "Product_Master",
    draft.rawMaterials.map(function (rm) {
      return rm.productId;
    }),
    productOf,
  ).then(function (rows) {
    const edits = new Map<string, StockEdit>();
    draft.rawMaterials.forEach(function (rm) {
      const edit = stockEditFor(
        edits,
        rm.productId,
        rows.get(rm.productId),
        function () {
          return {
            Warehouse_Code: draft.warehouseCode,
            Warehouse: draft.warehouseId,
            Product_Master: rm.productId,
          };
        },
      )!;
      // A new row gets Reserved_Stock only, matching the native insert.
      if (!edit.row && !Object.keys(edit.changes).length) {
        setStockQty(edit, "Reserved_Stock", rm.allocateQuantity);
        return;
      }
      const reservedStock =
        stockQty(edit, "Reserved_Stock") + rm.allocateQuantity;
      setStockQty(edit, "Reserved_Stock", reservedStock);
      setStockQty(
        edit,
        "Available_Stocks",
        stockQty(edit, "Stock_On_Hand") - stockQty(edit, "Reserved_Stock"),
      );
    });
    const writes = writeStockEdits(
      edits,
      CONFIG.MAIN_WAREHOUSE_STOCK_REPORT,
      CONFIG.MAIN_WAREHOUSE_STOCK_FORM,
    );
    return Promise.all(Array.from(writes.values())).then(function () {
      return undefined;
    });
  });
}

// Writes a confirmed draft: MRP header, fresh Finished_Goods rows scoped to
// the MRP, Raw_Materials rows, the Production Target's Status update, and
// finally the Sequence_Master bump — only after everything else has
// succeeded, so a failed/partial commit doesn't burn a sequence number.
export function commitMrpDraft(
  draft: MrpDraft,
  notes: string,
): Promise<CreateMrpResult> {
  // The procurement-required signal belongs on Production_Targets.Status
  // (values Planned/Released/Waiting for Stock/In Progress/Completed,
  // confirmed against the app's .ds export), NOT on the MRP record —
  // Material_Requirement_Planning.Status is a separate, unrelated
  // True/False field that always gets its native default here.
  const productionTargetStatus: ProductionTargetStatus = draft.hasShortfall
    ? "Waiting for Stock"
    : "Released";

  const fgSubform = CONFIG.MRP_FINISHED_GOODS_SUBFORM;
  const rmSubform = CONFIG.MRP_RAW_MATERIALS_SUBFORM;
  // Mirrors the native "Generate MRP ID" workflow: it creates fresh
  // Finished_Goods rows scoped to the MRP (Item/UOM/Target_Quantity
  // copied over, MRP_ID set), rather than re-linking the rows already
  // attached to the Production Target — those stay exactly as they
  // were, under Production_Target_ID only.
  const finishedGoodRows = draft.finishedGoods.map(function (fg) {
    return {
      Item: fg.itemId,
      UOM: fg.uomId,
      Target_Quantity: fg.targetQuantity,
    };
  });
  const rawMaterialRows = draft.rawMaterials.map(function (rm) {
    return {
      Product_Name: rm.productId,
      UOM: rm.uom,
      Stock_On_hand: rm.stockOnHand,
      Stock_Required: rm.stockRequired,
      Allocate_Quantity: rm.allocateQuantity,
      Needed_Quantity: rm.neededQuantity,
      Status: rm.status,
    };
  });
  // With a subform's link name set in CONFIG, its rows go inline in the
  // header's own payload (one request); otherwise each is its own row.
  const header: Record<string, any> = {
    MRP_ID: draft.mrpId,
    Production_Target: draft.productionTargetRecordId,
    Warehouse: draft.warehouseId,
    MRP_Date: draft.mrpDate,
    Notes: notes,
    Status: "False",
  };
  if (fgSubform && finishedGoodRows.length)
    header[fgSubform] = finishedGoodRows;
  if (rmSubform && rawMaterialRows.length) header[rmSubform] = rawMaterialRows;

  return addRecord(CONFIG.MRP_FORM, header).then(function (mrpRecord) {
    const mrpRecordId: string = display(mrpRecord.ID);

    // Fired together — the request queue keeps them under Creator's cap on
    // simultaneous in-flight API calls (code 2955).
    const lineWrites = (
      fgSubform
        ? []
        : finishedGoodRows.map(function (row) {
            return addRecord(CONFIG.FINISHED_GOODS_FORM, {
              MRP_ID: mrpRecordId,
              ...row,
            });
          })
    ).concat(
      rmSubform
        ? []
        : rawMaterialRows.map(function (row) {
            return addRecord(CONFIG.RAW_MATERIALS_FORM, {
              MRP_ID: mrpRecordId,
              ...row,
            });
          }),
    );
    // Mirrors the native "Generate MRP ID" form's own "on add, on
    // success" workflow, which creates a Non_Stock_Items row for every
    // raw material line with Needed_Quantity > 0 — this is what backs
    // the "Required Materials" custom action on the MRP list
    // (opens Non_Stock_Items_Report?MRP_ID=...). That workflow doesn't
    // fire for MRPs created via the JS SDK's addRecords, same reason as
    // every other "on add" workflow replicated in this file, so without
    // this an MRP created through the widget shows "No Data Available"
    // there even though its Raw_Materials/procurement status are fine.
    function writeNonStockItems(): Promise<any[]> {
      const shortfallRawMaterials = draft.rawMaterials.filter(function (rm) {
        return rm.neededQuantity > 0;
      });
      return runAll(shortfallRawMaterials, function (rm) {
        return resolveUomMasterId(rm.uom).then(function (uomMasterId) {
          return addRecord(CONFIG.NON_STOCK_ITEMS_FORM, {
            MRP_ID: mrpRecordId,
            Product: rm.productId,
            UOM: uomMasterId,
            Stock_On_Hand: rm.stockOnHand,
            Stock_Required: rm.stockRequired,
            Allocate_Quantity: rm.allocateQuantity,
            Needed_Quantity: rm.neededQuantity,
            Status: "Needs Purchase",
          });
        });
      });
    }

    // The stock reservation and Non_Stock_Items touch different forms, so
    // they run together once the MRP's own lines are in.
    return Promise.all(lineWrites)
      .then(function () {
        return Promise.all([
          reserveMainWarehouseStockForMrp(draft),
          writeNonStockItems(),
        ]);
      })
      .then(function () {
        return updateRecord(
          CONFIG.PRODUCTION_TARGET_REPORT,
          draft.productionTargetRecordId,
          {
            Status: productionTargetStatus,
          },
        );
      })
      .then(function () {
        return bumpMrpSequence(draft.sequenceRowId, draft.sequenceMrpNo);
      })
      .then(function () {
        return {
          mrpRecordId: mrpRecordId,
          mrpId: draft.mrpId,
          rawMaterials: draft.rawMaterials,
        };
      });
  });
}

// ───────────── MRP Details (Finished Goods & Raw Materials for Report) ─────────────

export function fetchFinishedGoodsForMrp(
  mrpRecordId: string,
  productionTargetRecordId?: string,
): Promise<FinishedGoodTargetRow[]> {
  const criteria = `MRP_ID == ${mrpRecordId}`;
  return getRecords(CONFIG.FINISHED_GOODS_REPORT, criteria).then(
    function (rows) {
      if (rows && rows.length > 0) {
        return rows.map(function (r: any) {
          return {
            id: r.ID,
            productionTargetRecordId:
              lookupId(r.Production_Target_ID) ||
              productionTargetRecordId ||
              "",
            itemId: lookupId(r.Item),
            // This MRP-only fallback does not feed a Consumption Entry;
            // fetchFinishedGoodsForTarget resolves Inventory_ID when it does.
            booksItemId: "",
            itemName: display(r.Item),
            uomId: lookupId(r.UOM),
            uomName: display(r.UOM),
            targetQuantity: parseFloat(display(r.Target_Quantity)) || 0,
          };
        });
      }
      // Fallback: lookup by Production Target record ID if not tagged with MRP_ID yet
      if (productionTargetRecordId) {
        return fetchFinishedGoodsForTarget(productionTargetRecordId);
      }
      return [];
    },
  );
}

export function fetchRawMaterialsForMrp(
  mrpRecordId: string,
): Promise<RawMaterialNeedRow[]> {
  const criteria = `MRP_ID == ${mrpRecordId}`;
  return getRecords(CONFIG.RAW_MATERIALS_REPORT, criteria).then(
    function (rows) {
      if (!rows || !rows.length) return [];
      return rows.map(function (r: any) {
        return {
          productId:
            lookupId(r.Product_Name) ||
            lookupId(r.Product) ||
            display(r.Product_Name),
          productName: display(r.Product_Name) || display(r.Product),
          uom: display(r.UOM),
          stockOnHand:
            parseFloat(display(r.Stock_On_hand || r.Stock_On_Hand)) || 0,
          stockRequired: parseFloat(display(r.Stock_Required)) || 0,
          allocateQuantity:
            parseFloat(display(r.Allocate_Quantity || r.Allocated_Qty)) || 0,
          neededQuantity:
            parseFloat(display(r.Needed_Quantity || r.Needed_Qty)) || 0,
          status: (display(r.Status) ||
            "Stock Available") as RawMaterialNeedRow["status"],
        };
      });
    },
  );
}

export function fetchMrpDetails(
  mrpRecord: MrpRow,
  productionTargetRecordId: string,
): Promise<MrpDetailData> {
  return Promise.all([
    fetchFinishedGoodsForMrp(mrpRecord.id, productionTargetRecordId),
    fetchRawMaterialsForMrp(mrpRecord.id),
  ]).then(function (results) {
    const finishedGoods = results[0];
    let rawMaterials = results[1];

    if (rawMaterials.length > 0) {
      const hasShortfall = rawMaterials.some(function (rm) {
        return rm.status === "Needs Purchase";
      });
      return fetchBomItemsForFinishedGoods(finishedGoods).then(
        function (bomByFinishedGood) {
          return {
            mrpRecord: mrpRecord,
            finishedGoods: finishedGoods,
            rawMaterials: rawMaterials,
            hasShortfall: hasShortfall,
            bomByFinishedGood: bomByFinishedGood,
          };
        },
      );
    }

    // Fallback: If Raw_Materials_Report has no rows returned (e.g. mock data or unindexed),
    // compute needs dynamically from finished goods BOM
    if (finishedGoods.length > 0) {
      return computeRawMaterialNeeds(finishedGoods).then(function (computed) {
        const hasShortfall = computed.some(function (rm) {
          return rm.status === "Needs Purchase";
        });
        return {
          mrpRecord: mrpRecord,
          finishedGoods: finishedGoods,
          rawMaterials: computed,
          hasShortfall: hasShortfall,
        };
      });
    }

    return {
      mrpRecord: mrpRecord,
      finishedGoods: [],
      rawMaterials: [],
      hasShortfall: false,
    };
  });
}

// ───────────── Start Production ─────────────

export function fetchEmployees(): Promise<EmployeeOption[]> {
  if (!employeesPromise) {
    employeesPromise = getRecords(CONFIG.EMPLOYEE_REPORT)
      .then(function (rows) {
        return rows.map(function (r: any) {
          return {
            id: r.ID,
            name:
              formatEmployeeName(r.Employee_Name) ||
              display(r.Employee_ID) ||
              "Unnamed",
          };
        });
      })
      .catch(function (error) {
        employeesPromise = null;
        throw error;
      });
  }
  return employeesPromise;
}

// Starts production for a Production Target by setting its status to "In Progress"
// and updating its Start_Date, End_Date, and Assigned_To from the user input.
export function startProduction(
  productionTargetRecordId: string,
  details: StartProductionDetails,
): Promise<any> {
  const payload: Record<string, any> = {
    Status: "In Progress" as ProductionTargetStatus,
    Start_Date: formatDateStringForZoho(details.startDate),
  };
  if (details.endDate) {
    payload.End_Date = formatDateStringForZoho(details.endDate);
  }
  if (details.assignedToId) {
    payload.Assigned_To = details.assignedToId;
  }
  if (details.notes !== undefined) {
    payload.Notes = details.notes;
  }

  return updateRecord(
    CONFIG.PRODUCTION_TARGET_REPORT,
    productionTargetRecordId,
    payload,
  );
}

// ⚠️ Fill these in from the Custom API's Summary page in Microservices.
// workspace_name is the ACCOUNT/workspace slug ("info_divinafoodco"),
// NOT the same as CONFIG.APP_NAME ("divina-foods") used elsewhere in this file.
const ALLOCATE_STOCK_API = {
  api_name: "allocate_Stock_On_Production_Start",
  workspace_name: "info_divinafoodco",
  public_key: "u3utxmSOfbbUK11zdtkbHptps",
};

// Calls the Custom API that runs the allocateStockOnProductionStart Deluge
// function — allocates raw-material stock for this Production Target's MRP.
// Does NOT touch Production_Target.Status; that's still startProduction()'s job.
export function allocateStockOnProductionStart(
  productionTargetRecordId: string,
): Promise<any> {
  return zohoData("invokeCustomApi", {
    api_name: ALLOCATE_STOCK_API.api_name,
    workspace_name: ALLOCATE_STOCK_API.workspace_name,
    http_method: "POST",
    content_type: "application/json",
    payload: {
      production_target_id: productionTargetRecordId,
    },
    public_key: ALLOCATE_STOCK_API.public_key,
  }).then(function (resp: any) {
    // Zoho's own convention (used throughout this file for getRecords/
    // addRecords/updateRecordById) is code 3000 = success — NOT an HTTP-style
    // "< 400 is success" scheme. This response's own success codes (3000,
    // and error codes like 3001/3330 seen elsewhere in this app) are all
    // >= 400 numerically, so a `resp.code >= 400` check flags every
    // successful call as a failure. Check the actual shape instead:
    // { code: 3000, result: { status: "success", message: "...", ... } }.
    const result = resp && resp.result;
    if (
      !resp ||
      resp.code !== 3000 ||
      (result && result.status && result.status !== "success")
    ) {
      return Promise.reject(
        new Error(
          (result && result.message) ||
            "Failed to allocate stock for production.",
        ),
      );
    }
    return resp;
  });
}

// Published as "AllocateAndCommitBatch" in Microservices
// (function: FEFO.AllocateAndCommitBatch). Supersedes allocateStockOnProductionStart
// above (left in place, just no longer called) — does the FEFO batch pick
// AND the Reserved_Stock → Committed_Stocks transition in one call, and
// hands back which specific batch(es) each raw material was drawn from so
// the widget can show it.
const ALLOCATE_AND_COMMIT_BATCH_API = {
  api_name: "AllocateAndCommitBatch",
  workspace_name: "info_divinafoodco",
  public_key: "RWgBNeUuWqXC9BrfSavqwT3fT",
};

// Resolves once the Deluge function has done the FEFO pick, the
// Reserved_Stock → Committed_Stocks transition, AND written a persistent
// FEFO_Batch_Allocation record (+ its Batch_Allocation lines) for this
// production target. The widget never parses the response's own
// "allocations" field for display — those are Deluge's raw 17-digit record
// IDs (batch_lineRec.ID / batch_lineRec.Product_Master) put into the
// response Map untouched, which exceed Number.MAX_SAFE_INTEGER and silently
// round on the JSON round-trip to the browser (classic
// large-int-as-JSON-number precision loss) — that's why the batch card used
// to show a garbled numeric ID instead of the item name. Reading the
// persisted record back through getRecords (see
// fetchBatchAllocationsForProductionTarget below) sidesteps that entirely,
// since Zoho's own REST API always returns record IDs as precision-safe
// strings — and it's what makes the breakdown survive a page reload too.
export function allocateAndCommitBatch(
  productionTargetRecordId: string,
): Promise<void> {
  return zohoData("invokeCustomApi", {
    api_name: ALLOCATE_AND_COMMIT_BATCH_API.api_name,
    workspace_name: ALLOCATE_AND_COMMIT_BATCH_API.workspace_name,
    http_method: "POST",
    content_type: "application/json",
    payload: {
      production_target_id: productionTargetRecordId,
    },
    public_key: ALLOCATE_AND_COMMIT_BATCH_API.public_key,
  }).then(function (resp: any) {
    const result = resp && resp.result;
    if (
      !resp ||
      resp.code !== 3000 ||
      (result && result.status && result.status !== "success")
    ) {
      return Promise.reject(
        new Error(
          (result && result.message) ||
            "Failed to allocate batches for this production run.",
        ),
      );
    }
  });
}

// Reads back the FEFO_Batch_Allocation record (+ its Batch_Allocation grid)
// that AllocateAndCommitBatch persists for a production target — same
// two-step header-then-lines pattern as fetchPurchaseOrders/PO_Line_Items.
// Both Batch_NO and Product are configured with a displayformat
// ([Batch_Number] / [Product_Name] respectively), so display() on them
// already returns the human-readable text, not the raw ID.
export function fetchBatchAllocationsForProductionTarget(
  productionTargetRecordId: string,
): Promise<BatchAllocationLine[]> {
  if (!productionTargetRecordId) return Promise.resolve([]);
  const criteria = `Production_Targets == ${productionTargetRecordId}`;
  return getRecords(CONFIG.FEFO_BATCH_ALLOCATION_REPORT, criteria).then(
    function (headerRows) {
      if (!headerRows || !headerRows.length) return [];
      // One header per Start Production click — if it's ever clicked more
      // than once for the same target, use the most recently created one.
      const headerId = headerRows[headerRows.length - 1].ID;
      return getRecords(
        CONFIG.BATCH_ALLOCATION_REPORT,
        `FEFO_Batch_ID == ${headerId}`,
      ).then(function (rows) {
        if (!rows || !rows.length) return [];
        return rows.map(function (r: any): BatchAllocationLine {
          return {
            batchId: lookupId(r.Batch_NO) || display(r.Batch_NO),
            batchNumber: display(r.Batch_NO) || undefined,
            productId: lookupId(r.Product) || display(r.Product),
            productName: display(r.Product) || undefined,
            expiryDate: display(r.Expiry_Date),
            stockOnHand: parseFloat(display(r.Stock_On_Hand)) || 0,
            batchQty: parseFloat(display(r.Batch_Qty)) || 0,
            remainingQty: parseFloat(display(r.Remaining_Qty)) || 0,
          };
        });
      });
    },
  );
}

// ───────────── Complete Production (Consumption Entry) ─────────────
// Mirrors the native "Complete Production" custom action on the
// Production_Inprogress list: that action just opens the Consumption_Entry
// form as a popup pre-filled with Production_Target=input.ID. The actual
// pre-fill (finished goods from the target, raw materials from the MRP's
// allocated quantities) lives in Consumption_Entry's own "Fetch Production
// Target" form-load workflow, and the "mark Completed" step lives in its
// "on add success" workflow — both are UI/record-level Deluge that only
// fires for Creator's own form, not for records created via the JS SDK, so
// prepareConsumptionDraft/commitConsumptionEntry replicate them here.
//
// The downstream Scrap/Main/Production warehouse stock bookkeeping (see
// applyConsumptionStock below) is replicated client-side too —
// it used to go through an "UpdateWarehouse" Custom API/Deluge function, but
// that repeatedly failed to actually persist the Scrap Warehouse updates
// despite returning a clean success response, so it's now done directly
// against the Data API from here instead.

function generateConsumptionId(sequenceRow: any): string {
  const prefix = display(sequenceRow.Consumption_Name);
  const currentNo = parseInt(display(sequenceRow.Consumption_No), 10) || 0;
  return prefix + String(currentNo).padStart(3, "0");
}

function bumpConsumptionSequence(
  sequenceRowId: string,
  currentConsumptionNo: number,
): Promise<any> {
  return updateRecord(CONFIG.SEQUENCE_MASTER_REPORT, sequenceRowId, {
    Consumption_No: currentConsumptionNo + 1,
  });
}

// Computes the draft; writes nothing to Zoho. Finished-good lines default
// Produced_Quantity to the full Target_Quantity (edited down by the user if
// the run fell short); raw-material lines default Consumed_Quantity to the
// MRP's already-allocated quantity.
export function prepareConsumptionDraft(
  productionTargetRecordId: string,
  productionTargetId: string,
  mrpRecordId: string,
): Promise<ConsumptionEntryDraft> {
  return Promise.all([
    fetchFinishedGoodsForTarget(productionTargetRecordId),
    mrpRecordId
      ? fetchRawMaterialsForMrp(mrpRecordId)
      : Promise.resolve([] as RawMaterialNeedRow[]),
    fetchSequenceMasterRow(),
  ]).then(function (results) {
    const finishedGoods = results[0];
    const rawMaterials = results[1];
    const sequenceRow = results[2];

    if (!finishedGoods.length) {
      return Promise.reject(
        new Error(
          "This Production Target has no finished-good lines to log production against.",
        ),
      );
    }

    return {
      productionTargetRecordId: productionTargetRecordId,
      productionTargetId: productionTargetId,
      consumptionId: generateConsumptionId(sequenceRow),
      date: new Date().toISOString().slice(0, 10),
      remarks: "",
      finishedGoods: finishedGoods.map(function (fg) {
        return {
          itemId: fg.itemId,
          booksItemId: fg.booksItemId,
          itemName: fg.itemName,
          uom: fg.uomName,
          targetQuantity: fg.targetQuantity,
          producedQuantity: fg.targetQuantity,
          scrapQuantity: 0,
          batchNo: "",
          // Defaults to the same "today" as the header Date field — this run
          // is being completed now, so that's the sensible default MFD; the
          // user can pull it back if manufacturing actually finished earlier.
          manufacturingDate: new Date().toISOString().slice(0, 10),
          expiryDate: "",
        };
      }),
      rawMaterials: rawMaterials.map(function (rm) {
        return {
          productId: rm.productId,
          productName: rm.productName,
          uom: rm.uom,
          allocatedQuantity: rm.allocateQuantity,
          consumedQuantity: rm.allocateQuantity,
          scrapQuantity: 0,
        };
      }),
      sequenceRowId: sequenceRow.ID,
      sequenceConsumptionNo:
        parseInt(display(sequenceRow.Consumption_No), 10) || 0,
    };
  });
}

// Replicates the "on add, on success" warehouse bookkeeping directly against
// the Data API instead of through the "UpdateWarehouse" Custom API — that
// Deluge function kept returning a clean {code:3000, status:"success"}
// response while silently never creating/updating the Scrap Warehouse rows
// (root cause never pinned down after checking the deployed code, the
// Warehouse_Master WH-003 lookup value, and the response body all coming
// back clean), so this does the same field-for-field logic as plain
// getRecords/addRecord/updateRecord calls from here, where it's directly
// inspectable and debuggable.
//
// It used to read and write each line's rows one request at a time (about
// 6 requests per raw material, all sequential — 30 s+ for a 10-line run);
// now the rows are read in a few batched requests, every change is worked
// out in memory, and each row is written once, several writes in flight at
// a time (see loadConsumptionStock / applyConsumptionStock).
const BATCH_NUMBER_PREFIX = "BFG-";
const BATCH_NUMBER_DIGITS = 6;

function findUnusedBatchNumber(
  candidateNo: number,
  attempt: number,
): Promise<string> {
  const candidate =
    BATCH_NUMBER_PREFIX +
    String(candidateNo).padStart(BATCH_NUMBER_DIGITS, "0");
  if (attempt > 5) return Promise.resolve(candidate);
  return getRecords(
    CONFIG.BATCH_DETAILS_REPORT,
    `Batch_Number == "${candidate}"`,
  ).then(function (existing) {
    if (!existing.length) return candidate;
    return findUnusedBatchNumber(candidateNo + 1, attempt + 1);
  });
}

// Generates the next "BFG-000001"-style batch number for the Complete
// Production dialog's Batch No field. Derives the next number from the
// highest existing BFG- batch already in Batch_Details (no dedicated
// counter field needed on Sequence_Master), then double-checks the
// candidate itself so a hand-typed batch number out of sequence (e.g.
// someone typed "BFG-000050" manually) can never collide with it.
export function generateNextBatchNumber(): Promise<string> {
  const criteria = `Batch_Number.startsWith("${BATCH_NUMBER_PREFIX}")`;
  return getRecords(CONFIG.BATCH_DETAILS_REPORT, criteria, 1000).then(
    function (rows) {
      let maxNo = 0;
      rows.forEach(function (r: any) {
        const suffix = display(r.Batch_Number).slice(
          BATCH_NUMBER_PREFIX.length,
        );
        const num = parseInt(suffix, 10);
        if (!isNaN(num) && num > maxNo) maxNo = num;
      });
      return findUnusedBatchNumber(maxNo + 1, 0);
    },
  );
}

// Everything the consumption save's stock bookkeeping reads, fetched in a
// handful of batched requests (one per ledger) instead of one per line.
interface ConsumptionStockRows {
  main: Map<string, any>; // Main_Warehouse_Stock_Details row by product
  production: Map<string, any>; // Production_Stock_Details row by product
  scrap: Map<string, any>; // Scrap_Warehouse_Stock_Details row by product
  fgBatches: Map<string, any>; // Batch_Details row by Batch_Number
  rmBatches: Map<string, any>; // Batch_Details row by record ID
  allocations: BatchAllocationLine[];
  mainWarehouse: { id: string; code: string } | null;
  scrapWarehouse: { id: string; code: string } | null;
}

function loadConsumptionStock(
  draft: ConsumptionEntryDraft,
): Promise<ConsumptionStockRows> {
  const finishedGoods = draft.finishedGoods.filter(function (fg) {
    return !!fg.itemId;
  });
  const rawMaterials = draft.rawMaterials.filter(function (rm) {
    return !!rm.productId;
  });
  const scrapProductIds = finishedGoods
    .filter(function (fg) {
      return fg.scrapQuantity > 0;
    })
    .map(function (fg) {
      return fg.itemId;
    })
    .concat(
      rawMaterials
        .filter(function (rm) {
          return rm.scrapQuantity > 0;
        })
        .map(function (rm) {
          return rm.productId;
        }),
    );

  const mainPromise = fetchFirstRowByKey(
    CONFIG.MAIN_WAREHOUSE_STOCK_REPORT,
    "Product_Master",
    finishedGoods
      .map(function (fg) {
        return fg.itemId;
      })
      .concat(
        rawMaterials.map(function (rm) {
          return rm.productId;
        }),
      ),
    productOf,
  );
  const productionPromise = fetchFirstRowByKey(
    CONFIG.PRODUCTION_STOCK_REPORT,
    "Product_Master",
    rawMaterials.map(function (rm) {
      return rm.productId;
    }),
    productOf,
  );
  const scrapPromise = fetchFirstRowByKey(
    CONFIG.SCRAP_WAREHOUSE_STOCK_REPORT,
    "Product_Master",
    scrapProductIds,
    productOf,
  );
  const fgBatchesPromise = fetchFirstRowByKey(
    CONFIG.BATCH_DETAILS_REPORT,
    "Batch_Number",
    finishedGoods.map(function (fg) {
      return fg.batchNo;
    }),
    function (row) {
      return display(row.Batch_Number);
    },
    true,
  );
  // The FEFO pick from Start Production, then the Batch_Details rows it
  // drew from for this run's raw materials.
  const rawMaterialIds = new Set(
    rawMaterials.map(function (rm) {
      return rm.productId;
    }),
  );
  const allocationsPromise = rawMaterials.length
    ? fetchBatchAllocationsForProductionTarget(draft.productionTargetRecordId)
    : Promise.resolve([] as BatchAllocationLine[]);
  const rmBatchesPromise = allocationsPromise.then(function (allocations) {
    return fetchFirstRowByKey(
      CONFIG.BATCH_DETAILS_REPORT,
      "ID",
      allocations
        .filter(function (line) {
          return rawMaterialIds.has(line.productId) && !!line.batchId;
        })
        .map(function (line) {
          return line.batchId;
        }),
      function (row) {
        return display(row.ID);
      },
    );
  });

  // A finished good with no Main Warehouse row yet (or a scrapped product
  // with no Scrap Warehouse row) gets a new row, which needs the warehouse.
  const mainWarehousePromise = mainPromise.then(function (main) {
    const needed = finishedGoods.some(function (fg) {
      return !main.has(fg.itemId);
    });
    return needed ? fetchWarehouseByCode("WH-001") : null;
  });
  const scrapWarehousePromise = scrapPromise.then(function (scrap) {
    const needed = scrapProductIds.some(function (id) {
      return !scrap.has(id);
    });
    return needed ? fetchWarehouseByCode("WH-003") : null;
  });

  return Promise.all([
    mainPromise,
    productionPromise,
    scrapPromise,
    fgBatchesPromise,
    rmBatchesPromise,
    allocationsPromise,
    mainWarehousePromise,
    scrapWarehousePromise,
  ]).then(function (r) {
    return {
      main: r[0],
      production: r[1],
      scrap: r[2],
      fgBatches: r[3],
      rmBatches: r[4],
      allocations: r[5],
      mainWarehouse: r[6],
      scrapWarehouse: r[7],
    };
  });
}

// Replicates the "on add, on success" warehouse bookkeeping, field for
// field, against the rows loadConsumptionStock read:
//  - each finished good adds its Produced_Quantity to its Main Warehouse
//    row (created if missing) and to its own Batch_Details row (looked up
//    by Batch_Number, created if missing), then posts a Books inventory
//    adjustment;
//  - each raw material releases its allocated quantity from its Main
//    Warehouse and Production Warehouse rows and from the Batch_Details rows
//    the FEFO pick drew it from, deleting a batch once it's used up;
//  - scrap on either goes to the Scrap Warehouse row (created if missing),
//    plus a Books adjustment for finished-good scrap.
// All changes are applied in memory in that order (see StockEdit), then each
// touched row is written once, with the writes running together through
// the request queue.
function applyConsumptionStock(
  draft: ConsumptionEntryDraft,
  stock: ConsumptionStockRows,
): Promise<void> {
  const finishedGoods = draft.finishedGoods.filter(function (fg) {
    return !!fg.itemId;
  });
  const rawMaterials = draft.rawMaterials.filter(function (rm) {
    return !!rm.productId;
  });
  const adjustmentDate = formatDateStringForZoho(draft.date);

  const mainEdits = new Map<string, StockEdit>();
  const productionEdits = new Map<string, StockEdit>();
  const scrapEdits = new Map<string, StockEdit>();
  // Batch_Details edits by record ID ("new:<Batch_Number>" for a new row),
  // plus the finished goods' own batches by Batch_Number.
  const batchEdits = new Map<string, StockEdit>();
  const fgBatchEdits = new Map<string, StockEdit>();
  // Finished goods whose Main Warehouse row is written (the Books
  // adjustment follows that write).
  const stockedFinishedGoods: typeof finishedGoods = [];

  function addScrap(productId: string, scrapQuantity: number): void {
    if (!(scrapQuantity > 0)) return;
    const edit = stockEditFor(
      scrapEdits,
      productId,
      stock.scrap.get(productId),
      function () {
        const scrapWh = stock.scrapWarehouse;
        return scrapWh
          ? {
              Warehouse_Code: scrapWh.code,
              Warehouse: scrapWh.id,
              Product_Master: productId,
            }
          : null;
      },
    );
    if (!edit) return;
    setStockQty(
      edit,
      "Scrap_Quantity",
      stockQty(edit, "Scrap_Quantity") + scrapQuantity,
    );
  }

  finishedGoods.forEach(function (fg) {
    const main = stockEditFor(
      mainEdits,
      fg.itemId,
      stock.main.get(fg.itemId),
      function () {
        const mainWh = stock.mainWarehouse;
        return mainWh
          ? {
              Warehouse_Code: mainWh.code,
              Warehouse: mainWh.id,
              Product_Master: fg.itemId,
            }
          : null;
      },
    );
    if (main) {
      const stockOnHand = stockQty(main, "Stock_On_Hand") + fg.producedQuantity;
      setStockQty(main, "Stock_On_Hand", stockOnHand);
      setStockQty(main, "Available_Stocks", stockOnHand);
      stockedFinishedGoods.push(fg);
    }

    if (fg.batchNo) {
      let batch = fgBatchEdits.get(fg.batchNo);
      if (batch) {
        setStockQty(
          batch,
          "Stock_On_Hand",
          stockQty(batch, "Stock_On_Hand") + fg.producedQuantity,
        );
      } else {
        const row = stock.fgBatches.get(fg.batchNo);
        if (row) {
          batch = stockEditFor(batchEdits, display(row.ID), row, null)!;
          setStockQty(
            batch,
            "Stock_On_Hand",
            stockQty(batch, "Stock_On_Hand") + fg.producedQuantity,
          );
        } else {
          batch = newStockEdit({
            Product_Master: fg.itemId,
            Batch_Number: fg.batchNo,
            Manufacturing_Date: formatDateStringForZoho(fg.manufacturingDate),
            Expiry_Date: formatDateStringForZoho(fg.expiryDate),
          });
          setStockQty(batch, "Stock_On_Hand", fg.producedQuantity);
          setStockQty(batch, "Available_Stocks", fg.producedQuantity);
          batchEdits.set("new:" + fg.batchNo, batch);
        }
        fgBatchEdits.set(fg.batchNo, batch);
      }
    }

    addScrap(fg.itemId, fg.scrapQuantity);
  });

  rawMaterials.forEach(function (rm) {
    const main = stockEditFor(
      mainEdits,
      rm.productId,
      stock.main.get(rm.productId),
      null,
    );
    if (main) {
      setStockQty(
        main,
        "Committed_Stocks",
        stockQty(main, "Committed_Stocks") - rm.allocatedQuantity,
      );
      setStockQty(
        main,
        "Stock_On_Hand",
        stockQty(main, "Stock_On_Hand") - rm.allocatedQuantity,
      );
    }

    const production = stockEditFor(
      productionEdits,
      rm.productId,
      stock.production.get(rm.productId),
      null,
    );
    if (production) {
      setStockQty(
        production,
        "Committed_Stocks",
        stockQty(production, "Committed_Stocks") - rm.allocatedQuantity,
      );
    }

    // Releases each batch FEFO picked for this raw material, and deletes it
    // once used up (Stock_On_Hand - Committed_Stocks <= 0) — the native
    // workflow's "if Available_Stocks == 0, delete" check, computed here.
    stock.allocations
      .filter(function (line) {
        return line.productId === rm.productId && !!line.batchId;
      })
      .forEach(function (line) {
        const row = stock.rmBatches.get(line.batchId);
        if (!row) return;
        const batch = stockEditFor(batchEdits, display(row.ID), row, null)!;
        if (batch.remove) return;
        const committedStocks = roundQty(
          stockQty(batch, "Committed_Stocks") - line.batchQty,
        );
        const stockOnHand = roundQty(
          stockQty(batch, "Stock_On_Hand") - line.batchQty,
        );
        if (roundQty(stockOnHand - committedStocks) <= 0) {
          batch.remove = true;
          return;
        }
        setStockQty(batch, "Committed_Stocks", committedStocks);
        setStockQty(batch, "Stock_On_Hand", stockOnHand);
      });

    addScrap(rm.productId, rm.scrapQuantity);
  });

  const mainWrites = writeStockEdits(
    mainEdits,
    CONFIG.MAIN_WAREHOUSE_STOCK_REPORT,
    CONFIG.MAIN_WAREHOUSE_STOCK_FORM,
  );
  const scrapWrites = writeStockEdits(
    scrapEdits,
    CONFIG.SCRAP_WAREHOUSE_STOCK_REPORT,
    CONFIG.SCRAP_WAREHOUSE_STOCK_FORM,
  );
  const productionWrites = writeStockEdits(
    productionEdits,
    CONFIG.PRODUCTION_STOCK_REPORT,
    "",
  );
  const batchWrites = writeStockEdits(
    batchEdits,
    CONFIG.BATCH_DETAILS_REPORT,
    CONFIG.BATCH_DETAILS_FORM,
  );

  // Books inventory adjustments follow their Creator stock write.
  // The Product_Master lookup does not always expose the external Books
  // item ID; skipping is safer than posting a Creator record ID as an
  // Inventory item ID.
  const outputAdjustments = stockedFinishedGoods.map(function (fg) {
    return mainWrites.get(fg.itemId)!.then(function () {
      if (!fg.booksItemId) {
        console.warn(
          "Inventory adjustment skipped (Books item ID is not available):",
          fg.itemId,
        );
        return null;
      }
      return createInventoryAdjustment(
        fg.booksItemId,
        fg.producedQuantity,
        "Production output",
        adjustmentDate,
      ).catch(function (err) {
        console.warn(
          "Inventory adjustment failed (Creator stock still updated):",
          err,
        );
      });
    });
  });
  const scrapAdjustments = finishedGoods
    .filter(function (fg) {
      return fg.scrapQuantity > 0;
    })
    .map(function (fg) {
      const write = scrapWrites.get(fg.itemId) || Promise.resolve(null);
      return write.then(function () {
        if (!fg.booksItemId) {
          console.warn(
            "Finished-good scrap Inventory adjustment skipped (Books item ID is not available):",
            fg.itemId,
          );
          return null;
        }
        return createFinishedGoodScrapInventoryAdjustment(
          fg.booksItemId,
          fg.scrapQuantity,
          "Production scrap",
          adjustmentDate,
        ).catch(function (err) {
          console.warn(
            "Finished-good scrap Inventory adjustment failed (Creator scrap stock still updated):",
            err,
          );
        });
      });
    });

  return Promise.all(
    ([] as Promise<any>[]).concat(
      Array.from(mainWrites.values()),
      Array.from(scrapWrites.values()),
      Array.from(productionWrites.values()),
      Array.from(batchWrites.values()),
      outputAdjustments,
      scrapAdjustments,
    ),
  ).then(function () {
    return undefined;
  });
}

// Child-row payloads for a Consumption_Entry. Each goes either inline in
// the header's own subform field (one request for everything, when the
// subform's link name is set in CONFIG) or as its own row in the subform's
// form, linked back to the header.
function consumptionFinishedGoodRow(
  fg: ConsumptionEntryDraft["finishedGoods"][number],
): Record<string, any> {
  // Batch_No, MFD_Date and Expiry_Date are all mandatory on this form now
  // (MFD_Date and Expiry_Date are "must have" fields) — the dialog's
  // canSubmit already blocks the commit until every line has all three,
  // so these are sent unconditionally rather than only-if-present.
  return {
    Finished_Good: fg.itemId,
    Target_Quantity: fg.targetQuantity,
    Produced_Quantity: fg.producedQuantity,
    Scrap_Quantity: fg.scrapQuantity,
    Batch_No: fg.batchNo,
    MFD_Date: formatDateStringForZoho(fg.manufacturingDate),
    Expiry_Date: formatDateStringForZoho(fg.expiryDate),
  };
}

function consumptionRawMaterialRow(
  rm: ConsumptionEntryDraft["rawMaterials"][number],
): Record<string, any> {
  return {
    Raw_Material: rm.productId,
    UOM: rm.uom,
    Allocated_Quantity: rm.allocatedQuantity,
    Consumed_Quantity: rm.consumedQuantity,
    Scrap_Quantity: rm.scrapQuantity,
  };
}

// Writes a confirmed draft: the Consumption_Entry header and its two subform
// grids (Finished_Goods_Cunsumptions, Consumption_Items), flips the
// Production Target to "Completed" (mirroring the native form's on-success
// workflow), updates warehouse stock (see applyConsumptionStock), and bumps
// the Sequence_Master counter last — only after everything else has
// succeeded, so a failed/partial commit doesn't burn a sequence number.
//
// The stock rows are read while the entry is being written (reads change
// nothing), and the stock writes still only start once the entry and the
// status update have succeeded.
export function commitConsumptionEntry(
  draft: ConsumptionEntryDraft,
): Promise<ConsumptionEntryRow> {
  const stockPromise = loadConsumptionStock(draft);
  // Handled below; this only stops an "unhandled rejection" warning when the
  // header write fails first and the stock rows are never used.
  stockPromise.catch(function () {});

  const fgSubform = CONFIG.CONSUMPTION_FINISHED_GOODS_SUBFORM;
  const rmSubform = CONFIG.CONSUMPTION_RAW_MATERIALS_SUBFORM;
  const header: Record<string, any> = {
    Consumption_ID: draft.consumptionId,
    Production_Target: draft.productionTargetRecordId,
    Date_field: formatDateStringForZoho(draft.date),
    Remarks: draft.remarks,
    Books_Sync_Status: "Pending",
  };
  if (fgSubform && draft.finishedGoods.length) {
    header[fgSubform] = draft.finishedGoods.map(consumptionFinishedGoodRow);
  }
  if (rmSubform && draft.rawMaterials.length) {
    header[rmSubform] = draft.rawMaterials.map(consumptionRawMaterialRow);
  }

  return addRecord(CONFIG.CONSUMPTION_ENTRY_FORM, header).then(
    function (entryRecord) {
      const entryId: string = display(entryRecord.ID);

      const finishedGoodRows = fgSubform
        ? []
        : draft.finishedGoods.map(function (fg) {
            return addRecord(CONFIG.FINISHED_GOODS_CONSUMPTIONS_FORM, {
              Consumption_Entry: entryId,
              ...consumptionFinishedGoodRow(fg),
            });
          });
      const rawMaterialRows = rmSubform
        ? []
        : draft.rawMaterials.map(function (rm) {
            return addRecord(CONFIG.CONSUMPTION_ITEMS_FORM, {
              Consumption_ID: entryId,
              ...consumptionRawMaterialRow(rm),
            });
          });

      return Promise.all(finishedGoodRows.concat(rawMaterialRows))
        .then(function () {
          // Posts the raw-material consumption/scrap to Books. Best-effort (a
          // failure is only logged) and it only reads this entry's own lines,
          // which are all saved by now — so it runs in the background while
          // the save carries on instead of holding it up.
          createInventoryAdjustmentForRawMaterialConsumption(entryId).catch(
            function (err: any) {
              console.warn(
                "Books raw-material consumption sync failed (Consumption Entry still recorded in Creator):",
                err,
              );
            },
          );
          return updateRecord(
            CONFIG.PRODUCTION_TARGET_REPORT,
            draft.productionTargetRecordId,
            {
              Status: "Completed" as ProductionTargetStatus,
            },
          );
        })
        .then(function () {
          return stockPromise;
        })
        .then(function (stock) {
          return applyConsumptionStock(draft, stock);
        })
        .then(function () {
          return bumpConsumptionSequence(
            draft.sequenceRowId,
            draft.sequenceConsumptionNo,
          );
        })
        .then(function () {
          return {
            id: entryId,
            consumptionId: draft.consumptionId,
            productionTargetId: draft.productionTargetId,
            date: formatDateStringForZoho(draft.date),
            remarks: draft.remarks,
            finishedGoods: draft.finishedGoods.map(function (fg) {
              return { id: "", ...fg };
            }),
            rawMaterials: draft.rawMaterials.map(function (rm) {
              return { id: "", ...rm };
            }),
          };
        });
    },
  );
}

// Fetch everything the Production Overview page needs
export function fetchProductionOverview(productionTargetId: string): Promise<{
  record: ProductionTargetRow | null;
  mrpRecord: MrpRow | null;
  mrpDetails: MrpDetailData | null;
  nonStockItems: NonStockItemRow[];
  procurementRecords: PurchaseOrderDetail[];
  productionInProgress: ProductionInProgressRow[];
  consumptionEntries: ConsumptionEntryRow[];
  finishedGoodsForTarget: FinishedGoodTargetRow[];
}> {
  return fetchProductionTarget(productionTargetId).then(function (record) {
    if (!record) {
      return Promise.resolve({
        record: null as ProductionTargetRow | null,
        mrpRecord: null as MrpRow | null,
        mrpDetails: null as MrpDetailData | null,
        nonStockItems: [] as NonStockItemRow[],
        procurementRecords: [] as PurchaseOrderDetail[],
        productionInProgress: [] as ProductionInProgressRow[],
        consumptionEntries: [] as ConsumptionEntryRow[],
        finishedGoodsForTarget: [] as FinishedGoodTargetRow[],
      });
    }

    // These three only need record/productionTargetId, not mrpRecord — start
    // them right away instead of nesting them inside fetchMrpRecord's .then
    // below, which used to force them to wait for the MRP lookup to finish
    // before even starting even though none of them depends on its result.
    // Finished_Goods rows for the target exist from the moment the
    // Production Target itself is created (see fetchFinishedGoodsForTarget's
    // own comment on the two-Finished_Goods-rows-per-run architecture), so
    // the Overview tab can show them before an MRP even exists.
    const productionInProgressPromise =
      fetchProductionInProgress(productionTargetId);
    const consumptionEntriesPromise = fetchConsumptionEntries(record.id);
    const finishedGoodsForTargetPromise = fetchFinishedGoodsForTarget(
      record.id,
    );

    return fetchMrpRecord(record.id).then(function (mrpRecord) {
      const mrpDetailsPromise = mrpRecord
        ? fetchMrpDetails(mrpRecord, record.id)
        : Promise.resolve(null as MrpDetailData | null);
      const nonStockItemsPromise = mrpRecord
        ? fetchNonStockItemsForMrp(mrpRecord.id)
        : Promise.resolve([] as NonStockItemRow[]);
      const purchaseOrdersPromise = mrpRecord
        ? fetchPurchaseOrdersForMrp(mrpRecord.id)
        : Promise.resolve([] as PurchaseOrderDetail[]);

      return Promise.all([
        purchaseOrdersPromise,
        productionInProgressPromise,
        consumptionEntriesPromise,
        mrpDetailsPromise,
        nonStockItemsPromise,
        finishedGoodsForTargetPromise,
      ]).then(function (rest) {
        return {
          record,
          mrpRecord,
          mrpDetails: rest[3] as MrpDetailData | null,
          nonStockItems: rest[4] as NonStockItemRow[],
          procurementRecords: rest[0] as PurchaseOrderDetail[],
          productionInProgress: rest[1],
          consumptionEntries: rest[2],
          finishedGoodsForTarget: rest[5] as FinishedGoodTargetRow[],
        };
      });
    });
  });
}

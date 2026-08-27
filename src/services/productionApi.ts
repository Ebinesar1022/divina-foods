// ─────────────────────────────────────────────
// productionApi.ts
// All calls use .then()/.catch() chains instead of async/await,
// matching the pattern used across Divina Foods' other Creator
// widgets (see maint-dashboard reference) — plain Promise chaining
// is the safest path for widget code running inside the Creator
// mobile app's embedded iOS Safari webview.
// ─────────────────────────────────────────────

import type {
  BomItemRow,
  ConsumptionEntryDraft,
  ConsumptionEntryRow,
  CreateMrpResult,
  EmployeeOption,
  FinishedGoodTargetRow,
  MrpDetailData,
  MrpDraft,
  MrpRow,
  ProcurementRow,
  ProductionInProgressRow,
  ProductionTargetRow,
  ProductionTargetStatus,
  RawMaterialNeedRow,
  RawMaterialStockRow,
  StartProductionDetails,
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
  BOM_MASTER_REPORT: "BOM_Master_Report",
  BOM_ITEMS_REPORT: "BOM_Items_Report",
  MAIN_WAREHOUSE_STOCK_REPORT: "Main_Warehouse_Stock_Details_Report",
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
  UOM_MASTER_REPORT: "UOM_Master_Report",

  // Confirmed against the app's .ds export (Divina_Foods_5.ds) —
  // Consumption_Entry's two grids (Finished_Good, Raw_Material_Consumptions)
  // are subform-backing forms, same pattern as MRP's Finished_Goods/Raw_Materials.
  CONSUMPTION_ENTRY_FORM: "Consumption_Entry",
  FINISHED_GOODS_CONSUMPTIONS_FORM: "Finished_Goods_Cunsumptions",
  FINISHED_GOODS_CONSUMPTIONS_REPORT: "Finished_Goods_Cunsumptions_Report",
  CONSUMPTION_ITEMS_FORM: "Consumption_Items",
  CONSUMPTION_ITEMS_REPORT: "Consumption_Items_Report",

  // Warehouse stock ledgers touched by completing production — confirmed
  // against the app's .ds export. All three are plain Creator forms (no
  // external Zoho Inventory connection involved), unlike the separate
  // "Update Inventory Adjustment" workflow.
  SCRAP_WAREHOUSE_STOCK_REPORT: "Scrap_Warehouse_Stock_Details_Report",
  PRODUCTION_STOCK_REPORT: "Production_Stock_Details_Report",
};

function display(value: any): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
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
  if (typeof value === "object") return value.ID != null ? String(value.ID) : "";
  return String(value);
}

// Employee.Employee_Name is a "name"-type field — comes back as
// { prefix, first_name, last_name, suffix }, matching the displayformat
// used for Assigned_To lookups elsewhere in the app (Production_Targets,
// Production_Order): "prefix first_name last_name suffix".
function formatEmployeeName(nameField: any): string {
  if (!nameField || typeof nameField !== "object") return "";
  return [nameField.prefix, nameField.first_name, nameField.last_name, nameField.suffix]
    .filter(Boolean)
    .join(" ")
    .trim();
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

// Zoho Creator enforces a low cap on simultaneous in-flight API calls per
// session — firing a get/update for every line of a multi-line record
// (several finished goods, several raw materials, each needing 2-3 lookups
// plus updates) via Promise.all blows past that cap and every call past it
// comes back `{ code: 2955, description: "You have reached the maximum
// number of API calls that can be simultaneously initiated at a time." }`.
// Chains each item's work with .then() instead, one request at a time.
function runSequentially<T, R>(items: T[], task: (item: T) => Promise<R>): Promise<R[]> {
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
  return window.ZOHO.CREATOR.DATA.addRecords({
    app_name: CONFIG.APP_NAME,
    form_name: formName,
    payload: {
      data: data,
    },
  }).then(function (resp: any) {
    if (!resp || resp.code !== 3000 || !resp.data) {
      return Promise.reject(new Error("Failed to create a record in " + formName + "."));
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
function updateRecord(reportName: string, recordId: string, data: Record<string, any>): Promise<any> {
  return window.ZOHO.CREATOR.DATA.updateRecordById({
    app_name: CONFIG.APP_NAME,
    report_name: reportName,
    id: recordId,
    payload: {
      data: data,
    },
  }).then(function (resp: any) {
    if (!resp || resp.code !== 3000) {
      return Promise.reject(new Error("Failed to update record " + recordId + " in " + reportName + "."));
    }
    return resp.data;
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
      assignedTo: display(r.Assigned_To),
      assignedToId: lookupId(r.Assigned_To),
      startDate: display(r.Start_Date),
      endDate: display(r.End_Date),
      status: display(r.Status) as ProductionTargetRow["status"],
      notes: display(r.Notes),
    };
  });
}

// ───────────── Material Requirement & Planning ─────────────
// NOTE: Material_Requirement_Planning.Production_Target is a lookup field.
// Creator's criteria engine matches lookups by the linked record's NUMERIC ID,
// NOT by display text — `Production_Target == "PT-118"` always returns 0 rows.
// Pass productionTargetRecordId (the numeric record ID from Production_Target)
// and match without quotes, same as fetchFinishedGoodsForTarget.
export function fetchMrpRecord(productionTargetRecordId: string): Promise<MrpRow | null> {
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
// Confirmed against the app's .ds export — this report is just
// Production_Targets filtered to Status == "In Progress"; there is no
// separate Assigned_By/Production_Status field, only the target's own
// Assigned_To/Status (the fields the "Complete Production" custom action
// column sits alongside natively).
export function fetchProductionInProgress(productionTargetId: string): Promise<ProductionInProgressRow[]> {
  const criteria = `Production_Target_ID == "${productionTargetId}"`;
  return getRecords(CONFIG.PRODUCTION_INPROGRESS_REPORT, criteria).then(function (rows) {
    return rows.map(function (r: any) {
      return {
        id: r.ID,
        productionTargetId: display(r.Production_Target_ID),
        date: display(r.Date_field),
        assignedBy: display(r.Assigned_To),
        productionStatus: display(r.Status),
      };
    });
  });
}

// ───────────── Consumption Entry ─────────────
// Consumption_Entry.Production_Target is a lookup — match by the
// Production Target's numeric record ID, same rule as every other lookup
// criteria in this file. Each entry's two grids (Finished_Good,
// Raw_Material_Consumptions) are separate subform-backing reports
// (Finished_Goods_Cunsumptions, Consumption_Items), so they're fetched by
// criteria on their own back-reference lookup, same pattern used for the
// MRP's Finished_Goods/Raw_Materials.
export function fetchConsumptionEntries(productionTargetRecordId: string): Promise<ConsumptionEntryRow[]> {
  if (!productionTargetRecordId) return Promise.resolve([]);
  const criteria = `Production_Target == ${productionTargetRecordId}`;
  return getRecords(CONFIG.CONSUMPTION_ENTRY_REPORT, criteria)
    .then(function (rows) {
      // Sequential (not Promise.all) — see runSequentially's comment:
      // enough entries fired at once trips Creator's cap on simultaneous
      // in-flight API calls (code 2955).
      return runSequentially(rows, function (r: any) {
        const entryId = display(r.ID);
        return Promise.all([
          getRecords(CONFIG.FINISHED_GOODS_CONSUMPTIONS_REPORT, `Consumption_Entry == ${entryId}`),
          getRecords(CONFIG.CONSUMPTION_ITEMS_REPORT, `Consumption_ID == ${entryId}`),
        ]).then(function (sub) {
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
              allocatedQuantity: parseFloat(display(rm.Allocated_Quantity)) || 0,
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
    })
    .then(function (entries) {
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
export function fetchFinishedGoodsForTarget(productionTargetRecordId: string): Promise<FinishedGoodTargetRow[]> {
  const criteria = `Production_Target_ID == ${productionTargetRecordId}`;
  return getRecords(CONFIG.FINISHED_GOODS_REPORT, criteria).then(function (rows) {
    return rows.map(function (r: any) {
      return {
        id: r.ID,
        productionTargetRecordId: lookupId(r.Production_Target_ID),
        itemId: lookupId(r.Item),
        itemName: display(r.Item),
        uomId: lookupId(r.UOM),
        uomName: display(r.UOM),
        targetQuantity: parseFloat(display(r.Target_Quantity)) || 0,
      };
    });
  });
}

// A finished good's BOM_Master row has a single BOM_Items grid — look up the
// BOM by its Product (the finished good), then read that BOM's items.
function fetchBomItemsForProduct(itemId: string): Promise<BomItemRow[]> {
  if (!itemId) return Promise.resolve([]);

  const bomCriteria = `Product == ${itemId}`;
  return getRecords(CONFIG.BOM_MASTER_REPORT, bomCriteria).then(function (bomRows) {
    if (!bomRows.length) return [];
    const bomId = bomRows[0].ID;

    const itemsCriteria = `BOM_ID == ${bomId}`;
    return getRecords(CONFIG.BOM_ITEMS_REPORT, itemsCriteria).then(function (itemRows) {
      return itemRows.map(function (r: any) {
        return {
          bomId: display(bomId),
          productId: lookupId(r.Product),
          productName: display(r.Product),
          quantityRequired: parseFloat(display(r.Quantity_Required)) || 0,
          uomId: lookupId(r.UOM),
          uomName: display(r.UOM),
        };
      });
    });
  });
}

// Available_Stocks is the source of truth for current stock — sum it across
// every Main_Warehouse_Stock_Details row for this raw material (normally
// just one, since there's a single Main Warehouse).
function fetchStockOnHand(productId: string): Promise<number> {
  if (!productId) return Promise.resolve(0);

  const criteria = `Product_Master == ${productId}`;
  return getRecords(CONFIG.MAIN_WAREHOUSE_STOCK_REPORT, criteria).then(function (rows) {
    const stockRows: RawMaterialStockRow[] = rows.map(function (r: any) {
      return {
        productId: lookupId(r.Product_Master) || productId,
        availableStock: parseFloat(display(r.Available_Stocks)) || 0,
      };
    });
    return stockRows.reduce(function (sum, row) {
      return sum + row.availableStock;
    }, 0);
  });
}

// Explodes every finished good through its BOM × Target_Quantity, aggregates
// duplicate raw materials across multiple finished-good lines, then compares
// the aggregated requirement to current stock to work out what's short.
function computeRawMaterialNeeds(finishedGoods: FinishedGoodTargetRow[]): Promise<RawMaterialNeedRow[]> {
  // Sequential (not Promise.all) — see runSequentially's comment: enough
  // finished goods/raw materials fired at once trips Creator's cap on
  // simultaneous in-flight API calls (code 2955).
  return runSequentially(finishedGoods, function (fg) {
    return fetchBomItemsForProduct(fg.itemId).then(function (bomItems) {
      return bomItems.map(function (item) {
        return {
          productId: item.productId,
          productName: item.productName,
          uom: item.uomName,
          requiredQuantity: item.quantityRequired * fg.targetQuantity,
        };
      });
    });
  }).then(function (perFinishedGood) {
    const aggregated = new Map<string, { productId: string; productName: string; uom: string; stockRequired: number }>();

    perFinishedGood.forEach(function (lines) {
      lines.forEach(function (line) {
        const existing = aggregated.get(line.productId);
        if (existing) {
          existing.stockRequired += line.requiredQuantity;
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

    return runSequentially(aggregatedList, function (rm) {
      return fetchStockOnHand(rm.productId);
    }).then(function (stockLevels) {
      return aggregatedList.map(function (rm, index) {
        const stockOnHand = stockLevels[index];
        const allocateQuantity = Math.min(stockOnHand, rm.stockRequired);
        const neededQuantity = Math.max(0, rm.stockRequired - stockOnHand);
        return {
          productId: rm.productId,
          productName: rm.productName,
          uom: rm.uom,
          stockOnHand: stockOnHand,
          stockRequired: rm.stockRequired,
          allocateQuantity: allocateQuantity,
          neededQuantity: neededQuantity,
          status: (neededQuantity > 0 ? "Needs Purchase" : "Stock Available") as RawMaterialNeedRow["status"],
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
    if (!rows.length) return Promise.reject(new Error("Sequence_Master has no row configured."));
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
function bumpMrpSequence(sequenceRowId: string, currentMrpNo: number): Promise<any> {
  return updateRecord(CONFIG.SEQUENCE_MASTER_REPORT, sequenceRowId, {
    MRP_No: currentMrpNo + 1,
  });
}

// Non_Stock_Items.UOM is a lookup to UOM_Master, but our raw-material rows
// only carry the UOM as plain text (same as the native "Generate MRP ID"
// workflow's own get_line.UOM) — resolve it the same way that workflow
// does: match UOM_Master's own UOM text field.
function resolveUomMasterId(uomText: string): Promise<string> {
  if (!uomText) return Promise.resolve("");
  return getRecords(CONFIG.UOM_MASTER_REPORT, `UOM == "${uomText}"`).then(function (rows) {
    return rows.length ? display(rows[0].ID) : "";
  });
}

// The app only ever books MRPs against "Main Warehouse" — no picker needed,
// just resolve that one Warehouse_Master row's own record ID, which is what
// gets written into MRP.Warehouse (a lookup to Warehouse_Master).
function fetchDefaultWarehouseId(): Promise<string> {
  const criteria = `Warehouse_Name == "Main Warehouse"`;
  return getRecords(CONFIG.WAREHOUSE_REPORT, criteria).then(function (rows) {
    if (!rows.length) {
      return Promise.reject(new Error('Could not find a "Main Warehouse" row in Warehouse_Master.'));
    }
    return display(rows[0].ID);
  });
}

function formatDateForZoho(date: Date): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
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
  productionTargetId: string
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
      return Promise.reject(new Error(`An MRP (${existingMrp.mrpId}) already exists for this Production Target.`));
    }

    return Promise.all([
      fetchFinishedGoodsForTarget(productionTargetRecordId),
      fetchSequenceMasterRow(),
      fetchDefaultWarehouseId(),
    ]).then(function (results) {
      const finishedGoods = results[0];
      const sequenceRow = results[1];
      const warehouseId = results[2];

      if (!finishedGoods.length) {
        return Promise.reject(
          new Error("This Production Target has no finished-good lines yet — add at least one before creating an MRP.")
        );
      }

      return computeRawMaterialNeeds(finishedGoods).then(function (rawMaterials) {
        const hasShortfall = rawMaterials.some(function (rm) {
          return rm.status === "Needs Purchase";
        });

        return {
          mrpId: generateMrpId(sequenceRow),
          mrpDate: formatDateForZoho(new Date()),
          productionTargetRecordId: productionTargetRecordId,
          productionTargetId: productionTargetId,
          warehouseId: warehouseId,
          finishedGoods: finishedGoods,
          rawMaterials: rawMaterials,
          hasShortfall: hasShortfall,
          sequenceRowId: sequenceRow.ID,
          sequenceMrpNo: parseInt(display(sequenceRow.MRP_No), 10) || 0,
        };
      });
    });
  });
}

// Writes a confirmed draft: MRP header, fresh Finished_Goods rows scoped to
// the MRP, Raw_Materials rows, the Production Target's Status update, and
// finally the Sequence_Master bump — only after everything else has
// succeeded, so a failed/partial commit doesn't burn a sequence number.
export function commitMrpDraft(draft: MrpDraft, notes: string): Promise<CreateMrpResult> {
  // The procurement-required signal belongs on Production_Targets.Status
  // (values Planned/Released/Waiting for Stock/In Progress/Completed,
  // confirmed against the app's .ds export), NOT on the MRP record —
  // Material_Requirement_Planning.Status is a separate, unrelated
  // True/False field that always gets its native default here.
  const productionTargetStatus: ProductionTargetStatus = draft.hasShortfall ? "Waiting for Stock" : "Released";

  return addRecord(CONFIG.MRP_FORM, {
    MRP_ID: draft.mrpId,
    Production_Target: draft.productionTargetRecordId,
    Warehouse: draft.warehouseId,
    MRP_Date: draft.mrpDate,
    Notes: notes,
    Status: "False",
  }).then(function (mrpRecord) {
    const mrpRecordId: string = display(mrpRecord.ID);

    // Mirrors the native "Generate MRP ID" workflow: it creates fresh
    // Finished_Goods rows scoped to the MRP (Item/UOM/Target_Quantity
    // copied over, MRP_ID set), rather than re-linking the rows already
    // attached to the Production Target — those stay exactly as they
    // were, under Production_Target_ID only.
    //
    // Sequential (not Promise.all) — see runSequentially's comment: enough
    // finished goods/raw materials fired at once trips Creator's cap on
    // simultaneous in-flight API calls (code 2955).
    return runSequentially(draft.finishedGoods, function (fg) {
      return addRecord(CONFIG.FINISHED_GOODS_FORM, {
        MRP_ID: mrpRecordId,
        Item: fg.itemId,
        UOM: fg.uomId,
        Target_Quantity: fg.targetQuantity,
      });
    })
      .then(function () {
        return runSequentially(draft.rawMaterials, function (rm) {
          return addRecord(CONFIG.RAW_MATERIALS_FORM, {
            MRP_ID: mrpRecordId,
            Product_Name: rm.productId,
            UOM: rm.uom,
            Stock_On_hand: rm.stockOnHand,
            Stock_Required: rm.stockRequired,
            Allocate_Quantity: rm.allocateQuantity,
            Needed_Quantity: rm.neededQuantity,
            Status: rm.status,
          });
        });
      })
      .then(function () {
        // Mirrors the native "Generate MRP ID" form's own "on add, on
        // success" workflow, which creates a Non_Stock_Items row for every
        // raw material line with Needed_Quantity > 0 — this is what backs
        // the "Required Materials" custom action on the MRP list
        // (opens Non_Stock_Items_Report?MRP_ID=...). That workflow doesn't
        // fire for MRPs created via the JS SDK's addRecords, same reason as
        // every other "on add" workflow replicated in this file, so without
        // this an MRP created through the widget shows "No Data Available"
        // there even though its Raw_Materials/procurement status are fine.
        const shortfallRawMaterials = draft.rawMaterials.filter(function (rm) {
          return rm.neededQuantity > 0;
        });
        return runSequentially(shortfallRawMaterials, function (rm) {
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
      })
      .then(function () {
        return updateRecord(CONFIG.PRODUCTION_TARGET_REPORT, draft.productionTargetRecordId, {
          Status: productionTargetStatus,
        });
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
  productionTargetRecordId?: string
): Promise<FinishedGoodTargetRow[]> {
  const criteria = `MRP_ID == ${mrpRecordId}`;
  return getRecords(CONFIG.FINISHED_GOODS_REPORT, criteria).then(function (rows) {
    if (rows && rows.length > 0) {
      return rows.map(function (r: any) {
        return {
          id: r.ID,
          productionTargetRecordId: lookupId(r.Production_Target_ID) || productionTargetRecordId || "",
          itemId: lookupId(r.Item),
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
  });
}

export function fetchRawMaterialsForMrp(mrpRecordId: string): Promise<RawMaterialNeedRow[]> {
  const criteria = `MRP_ID == ${mrpRecordId}`;
  return getRecords(CONFIG.RAW_MATERIALS_REPORT, criteria).then(function (rows) {
    if (!rows || !rows.length) return [];
    return rows.map(function (r: any) {
      return {
        productId: lookupId(r.Product_Name) || lookupId(r.Product) || display(r.Product_Name),
        productName: display(r.Product_Name) || display(r.Product),
        uom: display(r.UOM),
        stockOnHand: parseFloat(display(r.Stock_On_hand || r.Stock_On_Hand)) || 0,
        stockRequired: parseFloat(display(r.Stock_Required)) || 0,
        allocateQuantity: parseFloat(display(r.Allocate_Quantity || r.Allocated_Qty)) || 0,
        neededQuantity: parseFloat(display(r.Needed_Quantity || r.Needed_Qty)) || 0,
        status: (display(r.Status) || "Stock Available") as RawMaterialNeedRow["status"],
      };
    });
  });
}

export function fetchMrpDetails(
  mrpRecord: MrpRow,
  productionTargetRecordId: string
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
      return {
        mrpRecord: mrpRecord,
        finishedGoods: finishedGoods,
        rawMaterials: rawMaterials,
        hasShortfall: hasShortfall,
      };
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
  return getRecords(CONFIG.EMPLOYEE_REPORT).then(function (rows) {
    return rows.map(function (r: any) {
      return {
        id: r.ID,
        name: formatEmployeeName(r.Employee_Name) || display(r.Employee_ID) || "Unnamed",
      };
    });
  });
}

// Starts production for a Production Target by setting its status to "In Progress"
// and updating its Start_Date, End_Date, and Assigned_To from the user input.
export function startProduction(
  productionTargetRecordId: string,
  details: StartProductionDetails
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

  return updateRecord(CONFIG.PRODUCTION_TARGET_REPORT, productionTargetRecordId, payload);
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
export function allocateStockOnProductionStart(productionTargetRecordId: string): Promise<any> {
  return window.ZOHO.CREATOR.DATA.invokeCustomApi({
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
    if (!resp || resp.code !== 3000 || (result && result.status && result.status !== "success")) {
      return Promise.reject(
        new Error((result && result.message) || "Failed to allocate stock for production.")
      );
    }
    return resp;
  });
}

// ⚠️ From the "UpdateWarehouse" Custom API's Summary page in Microservices.
const UPDATE_WAREHOUSE_STOCK_API = {
  api_name: "UpdateWarehouse",
  workspace_name: "info_divinafoodco",
  public_key: "kCfMhmAE0sxAkrU2vWbUXMthV",
};

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
// NOTE: this deliberately does NOT replicate the native app's downstream
// Zoho Inventory adjustments or Scrap/Main/Production warehouse stock
// bookkeeping (Update_the_Scrap_Warehous / Update_Inventory_Adjustme
// workflows) — those depend on an org-specific "inventory_conn" connection
// that isn't reachable from widget JS, and are out of scope for this UI.

function generateConsumptionId(sequenceRow: any): string {
  const prefix = display(sequenceRow.Consumption_Name);
  const currentNo = parseInt(display(sequenceRow.Consumption_No), 10) || 0;
  return prefix + String(currentNo).padStart(3, "0");
}

function bumpConsumptionSequence(sequenceRowId: string, currentConsumptionNo: number): Promise<any> {
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
  mrpRecordId: string
): Promise<ConsumptionEntryDraft> {
  return Promise.all([
    fetchFinishedGoodsForTarget(productionTargetRecordId),
    mrpRecordId ? fetchRawMaterialsForMrp(mrpRecordId) : Promise.resolve([] as RawMaterialNeedRow[]),
    fetchSequenceMasterRow(),
  ]).then(function (results) {
    const finishedGoods = results[0];
    const rawMaterials = results[1];
    const sequenceRow = results[2];

    if (!finishedGoods.length) {
      return Promise.reject(
        new Error("This Production Target has no finished-good lines to log production against.")
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
          itemName: fg.itemName,
          uom: fg.uomName,
          targetQuantity: fg.targetQuantity,
          producedQuantity: fg.targetQuantity,
          scrapQuantity: 0,
          batchNo: "",
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
      sequenceConsumptionNo: parseInt(display(sequenceRow.Consumption_No), 10) || 0,
    };
  });
}

// Calls the "UpdateWarehouse" Custom API, which runs the
// updateWarehouseStockOnConsumption Deluge function server-side — bumps the
// Main/Scrap/Production warehouse stock detail rows for both the finished
// goods produced and the raw materials consumed, mirroring the native
// "Update the Scrap Warehouse" workflow (Consumption_Entry, record event =
// on add, on success — which doesn't fire for records created through the
// JS SDK's addRecords, only through Creator's own form UI).
//
// This replaced an earlier client-side replication that fetched + updated
// every warehouse row one product at a time: with several finished goods
// and raw materials each needing 2-3 lookups plus updates, that blew past
// Creator's cap on simultaneous in-flight API calls (code 2955) and was
// slow even when it didn't. One Custom API call does all of it server-side.
function updateWarehouseStockForConsumption(draft: ConsumptionEntryDraft): Promise<any> {
  const finishedGoodsPayload = draft.finishedGoods
    .filter(function (fg) {
      return !!fg.itemId;
    })
    .map(function (fg) {
      return {
        Finished_Good: fg.itemId,
        Produced_Quantity: fg.producedQuantity,
        Scrap_Quantity: fg.scrapQuantity,
      };
    });

  const rawMaterialsPayload = draft.rawMaterials
    .filter(function (rm) {
      return !!rm.productId;
    })
    .map(function (rm) {
      return {
        Raw_Material: rm.productId,
        Allocated_Quantity: rm.allocatedQuantity,
        Scrap_Quantity: rm.scrapQuantity,
      };
    });

  return window.ZOHO.CREATOR.DATA.invokeCustomApi({
    api_name: UPDATE_WAREHOUSE_STOCK_API.api_name,
    workspace_name: UPDATE_WAREHOUSE_STOCK_API.workspace_name,
    http_method: "POST",
    content_type: "application/json",
    payload: {
      finished_goods: finishedGoodsPayload,
      raw_materials: rawMaterialsPayload,
    },
    public_key: UPDATE_WAREHOUSE_STOCK_API.public_key,
  }).then(function (resp: any) {
    // Same code-3000-means-success convention as allocateStockOnProductionStart.
    const result = resp && resp.result;
    if (!resp || resp.code !== 3000 || (result && result.status && result.status !== "success")) {
      return Promise.reject(new Error((result && result.message) || "Failed to update warehouse stock."));
    }
    return resp;
  });
}

// Writes a confirmed draft: the Consumption_Entry header, its two subform
// rows (Finished_Goods_Cunsumptions, Consumption_Items), flips the
// Production Target to "Completed" (mirroring the native form's on-success
// workflow), bumps the Sequence_Master counter, and updates warehouse stock
// (see updateWarehouseStockForConsumption) — only after everything else has
// succeeded, so a failed/partial commit doesn't burn a sequence number.
export function commitConsumptionEntry(draft: ConsumptionEntryDraft): Promise<ConsumptionEntryRow> {
  return addRecord(CONFIG.CONSUMPTION_ENTRY_FORM, {
    Consumption_ID: draft.consumptionId,
    Production_Target: draft.productionTargetRecordId,
    Date_field: formatDateStringForZoho(draft.date),
    Remarks: draft.remarks,
  }).then(function (entryRecord) {
    const entryId: string = display(entryRecord.ID);

    // Every step below is chained sequentially (not fired in parallel via
    // Promise.all) — see runSequentially's comment: a multi-line entry
    // (several finished goods + several raw materials, each needing its own
    // insert/lookup/update calls) fired all at once trips Zoho Creator's cap
    // on simultaneous in-flight API calls (code 2955).
    return runSequentially(draft.finishedGoods, function (fg) {
      const payload: Record<string, any> = {
        Consumption_Entry: entryId,
        Finished_Good: fg.itemId,
        Target_Quantity: fg.targetQuantity,
        Produced_Quantity: fg.producedQuantity,
        Scrap_Quantity: fg.scrapQuantity,
      };
      if (fg.batchNo) payload.Batch_No = fg.batchNo;
      if (fg.expiryDate) payload.Expiry_Date = formatDateStringForZoho(fg.expiryDate);
      return addRecord(CONFIG.FINISHED_GOODS_CONSUMPTIONS_FORM, payload);
    })
      .then(function () {
        return runSequentially(draft.rawMaterials, function (rm) {
          return addRecord(CONFIG.CONSUMPTION_ITEMS_FORM, {
            Consumption_ID: entryId,
            Raw_Material: rm.productId,
            UOM: rm.uom,
            Allocated_Quantity: rm.allocatedQuantity,
            Consumed_Quantity: rm.consumedQuantity,
            Scrap_Quantity: rm.scrapQuantity,
          });
        });
      })
      .then(function () {
        return updateRecord(CONFIG.PRODUCTION_TARGET_REPORT, draft.productionTargetRecordId, {
          Status: "Completed" as ProductionTargetStatus,
        });
      })
      .then(function () {
        return updateWarehouseStockForConsumption(draft);
      })
      .then(function () {
        return bumpConsumptionSequence(draft.sequenceRowId, draft.sequenceConsumptionNo);
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
  });
}

// Fetch everything the Production Overview page needs
export function fetchProductionOverview(productionTargetId: string): Promise<{
  record: ProductionTargetRow | null;
  mrpRecord: MrpRow | null;
  mrpDetails: MrpDetailData | null;
  procurementRecords: ProcurementRow[];
  productionInProgress: ProductionInProgressRow[];
  consumptionEntries: ConsumptionEntryRow[];
}> {
  return fetchProductionTarget(productionTargetId).then(function (record) {
    if (!record) {
      return Promise.resolve({
        record: null as ProductionTargetRow | null,
        mrpRecord: null as MrpRow | null,
        mrpDetails: null as MrpDetailData | null,
        procurementRecords: [] as ProcurementRow[],
        productionInProgress: [] as ProductionInProgressRow[],
        consumptionEntries: [] as ConsumptionEntryRow[],
      });
    }

    return fetchMrpRecord(record.id).then(function (mrpRecord) {
      // The procurement-required signal lives on Production_Targets.Status,
      // not on the MRP record (see types.ts) — only meaningful once an MRP
      // actually exists, hence the !!mrpRecord guard.
      const procurementNeeded = !!mrpRecord && record.status === "Waiting for Stock";

      const mrpDetailsPromise =
        mrpRecord ? fetchMrpDetails(mrpRecord, record.id) : Promise.resolve(null as MrpDetailData | null);

      return Promise.all([
        procurementNeeded ? fetchProcurementRecords(productionTargetId) : Promise.resolve([] as ProcurementRow[]),
        fetchProductionInProgress(productionTargetId),
        fetchConsumptionEntries(record.id),
        mrpDetailsPromise,
      ]).then(function (rest) {
        return {
          record,
          mrpRecord,
          mrpDetails: rest[3] as MrpDetailData | null,
          procurementRecords: rest[0] as ProcurementRow[],
          productionInProgress: rest[1],
          consumptionEntries: rest[2],
        };
      });
    });
  });
}


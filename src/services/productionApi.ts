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
  ConsumptionEntryRow,
  CreateMrpResult,
  FinishedGoodTargetRow,
  MrpRow,
  MrpStockStatus,
  ProcurementRow,
  ProductionInProgressRow,
  ProductionTargetRow,
  RawMaterialNeedRow,
  RawMaterialStockRow,
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

  // ⚠️ Create MRP additions — confirm every report AND form name below
  // against Creator → Reports / Creator → Forms (case sensitive) before
  // relying on this in production; these are transcribed from the .ds
  // export and not yet click-verified against the live app.
  FINISHED_GOODS_REPORT: "Finished_Goods_Report",
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
      startDate: display(r.Start_Date),
      endDate: display(r.End_Date),
      status: display(r.Status) as ProductionTargetRow["status"],
      notes: display(r.Notes),
    };
  });
}

// ───────────── Material Requirement & Planning ─────────────
export function fetchMrpRecord(productionTargetId: string): Promise<MrpRow | null> {
  const criteria = `Production_Target == "${productionTargetId}"`;
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
  const criteria = `Production_Target == "${productionTargetId}"`;
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
  const bomPromises = finishedGoods.map(function (fg) {
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
  });

  return Promise.all(bomPromises).then(function (perFinishedGood) {
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

    return Promise.all(
      aggregatedList.map(function (rm) {
        return fetchStockOnHand(rm.productId);
      })
    ).then(function (stockLevels) {
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
function bumpMrpSequence(sequenceRow: any): Promise<any> {
  const currentNo = parseInt(display(sequenceRow.MRP_No), 10) || 0;
  return updateRecord(CONFIG.SEQUENCE_MASTER_REPORT, sequenceRow.ID, {
    MRP_No: currentNo + 1,
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

// Creates the MRP for a Production Target: explodes its finished goods
// through their BOMs, checks stock, writes the MRP header + Raw_Materials
// rows, links the existing Finished_Goods rows to the new MRP, and bumps
// the Sequence_Master counter — only after everything else has succeeded.
export function createMrpForTarget(
  productionTargetRecordId: string,
  productionTargetId: string
): Promise<CreateMrpResult> {
  // Guard against duplicate MRPs — a second click after a page reload (or a
  // second tab) while the first create was still mid-flight would otherwise
  // race the Sequence_Master read and produce two headers with the same
  // generated MRP_ID. This doesn't fully close the race (both checks can
  // still run before either create finishes) but it catches the common case
  // where the first MRP has already landed by the time this one starts.
  return fetchMrpRecord(productionTargetId).then(function (existingMrp) {
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
        const mrpId = generateMrpId(sequenceRow);
        // Drives the pipeline's procurement-required logic elsewhere in this
        // widget (isProcurementRequired) — if even one raw material is short,
        // this MRP waits on procurement before production can start.
        const hasShortfall = rawMaterials.some(function (rm) {
          return rm.status === "Needs Purchase";
        });
        const stockStatus: MrpStockStatus = hasShortfall ? "Waiting for Stock" : "Ready For Production";

        return addRecord(CONFIG.MRP_FORM, {
          MRP_ID: mrpId,
          Production_Target: productionTargetRecordId,
          Warehouse: warehouseId,
          MRP_Date: formatDateForZoho(new Date()),
          Status: "False",
          Stock_Status: stockStatus,
        }).then(function (mrpRecord) {
          const mrpRecordId: string = display(mrpRecord.ID);

          const finishedGoodUpdates = finishedGoods.map(function (fg) {
            return updateRecord(CONFIG.FINISHED_GOODS_REPORT, fg.id, { MRP_ID: mrpRecordId });
          });

          const rawMaterialInserts = rawMaterials.map(function (rm) {
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

          return Promise.all(finishedGoodUpdates.concat(rawMaterialInserts)).then(function () {
            return bumpMrpSequence(sequenceRow).then(function () {
              return {
                mrpRecordId: mrpRecordId,
                mrpId: mrpId,
                rawMaterials: rawMaterials,
              };
            });
          });
        });
      });
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

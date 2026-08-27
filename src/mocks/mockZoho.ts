// Dev-only sample data so `npm run dev` renders a real-looking Production
// Overview without the Zoho Creator shell. Only wired up when
// import.meta.env.DEV is true AND window.ZOHO isn't already present
// (see main.tsx) — never touches the production bundle's behavior inside
// the real Creator widget.
import { CONFIG } from "../services/productionApi";

const DEMO_PT_ID = "PT-105";

const PRODUCTION_TARGET = [
  {
    ID: "1",
    Production_Target_ID: DEMO_PT_ID,
    Date_field: "20-Aug-2026",
    Assigned_To: { id: "1", Name: "Production Manager" },
    Start_Date: "20-Aug-2026",
    End_Date: "27-Aug-2026",
    Status: "In Progress",
    Notes: "Weekly batch — Margherita Pizza",
  },
];

const MRP = [
  {
    ID: "1",
    MRP_ID: "MRP-077",
    Production_Target_ID: DEMO_PT_ID,
    MRP_Date: "21-Aug-2026",
    Created_By45657: { id: "1", Deparment_Role: "Planner" },
    Notes: "Stock check completed for batch",
    Status: "False",
  },
];

const FINISHED_GOODS = [
  {
    ID: "1",
    Production_Target_ID: { ID: "1", display_value: DEMO_PT_ID },
    MRP_ID: { ID: "1", display_value: "MRP-077" },
    Item: { ID: "101", display_value: "Margherita Pizza" },
    UOM: { ID: "201", display_value: "Pcs" },
    Target_Quantity: "50",
  },
];

const RAW_MATERIALS = [
  {
    ID: "1",
    MRP_ID: { ID: "1", display_value: "MRP-077" },
    Product_Name: { ID: "301", display_value: "Salt" },
    UOM: "Kilogram",
    Stock_On_hand: "0.00",
    Stock_Required: "50.00",
    Allocate_Quantity: "0.00",
    Needed_Quantity: "50.00",
    Status: "Needs Purchase",
  },
  {
    ID: "2",
    MRP_ID: { ID: "1", display_value: "MRP-077" },
    Product_Name: { ID: "302", display_value: "Olive Oil" },
    UOM: "Ltr",
    Stock_On_hand: "50.00",
    Stock_Required: "25.00",
    Allocate_Quantity: "25.00",
    Needed_Quantity: "0.00",
    Status: "Stock Available",
  },
  {
    ID: "3",
    MRP_ID: { ID: "1", display_value: "MRP-077" },
    Product_Name: { ID: "303", display_value: "Yeast" },
    UOM: "Kilogram",
    Stock_On_hand: "200.00",
    Stock_Required: "50.00",
    Allocate_Quantity: "50.00",
    Needed_Quantity: "0.00",
    Status: "Stock Available",
  },
];

const PURCHASE_ORDERS: any[] = [];
const PURCHASE_RECEIVES: any[] = [];

const PRODUCTION_INPROGRESS = [
  {
    ID: "1",
    Production_Target_ID: DEMO_PT_ID,
    Date_field: "23-Aug-2026",
    Assigned_By: { id: "1", Deparment_Role: "Shift Supervisor" },
    Production_Status: "In Progress",
  },
];

const CONSUMPTION_ENTRY: any[] = [];
const FINISHED_GOODS_CONSUMPTIONS: any[] = [];
const CONSUMPTION_ITEMS: any[] = [];

const BOM_MASTER = [
  {
    ID: "1",
    Product: { ID: "101", display_value: "Margherita Pizza" },
  },
];

const BOM_ITEMS = [
  {
    ID: "1",
    BOM_ID: "1",
    Product: { ID: "301", display_value: "Salt" },
    Quantity_Required: "1",
    UOM: { ID: "401", display_value: "Kilogram" },
  },
  {
    ID: "2",
    BOM_ID: "1",
    Product: { ID: "302", display_value: "Olive Oil" },
    Quantity_Required: "0.5",
    UOM: { ID: "402", display_value: "Ltr" },
  },
  {
    ID: "3",
    BOM_ID: "1",
    Product: { ID: "303", display_value: "Yeast" },
    Quantity_Required: "1",
    UOM: { ID: "403", display_value: "Kilogram" },
  },
];

const MAIN_WAREHOUSE_STOCK = [
  { ID: "1", Product_Master: { ID: "301", display_value: "Salt" }, Stock_On_Hand: "0", Committed_Stocks: "0", Available_Stocks: "0" },
  { ID: "2", Product_Master: { ID: "302", display_value: "Olive Oil" }, Stock_On_Hand: "50", Committed_Stocks: "25", Available_Stocks: "50" },
  { ID: "3", Product_Master: { ID: "303", display_value: "Yeast" }, Stock_On_Hand: "200", Committed_Stocks: "50", Available_Stocks: "200" },
  { ID: "4", Product_Master: { ID: "101", display_value: "Margherita Pizza" }, Stock_On_Hand: "0", Committed_Stocks: "0", Available_Stocks: "0" },
];

const SCRAP_WAREHOUSE_STOCK = [
  { ID: "1", Product_Master: { ID: "301", display_value: "Salt" }, Scrap_Quantity: "0" },
  { ID: "2", Product_Master: { ID: "302", display_value: "Olive Oil" }, Scrap_Quantity: "0" },
  { ID: "3", Product_Master: { ID: "303", display_value: "Yeast" }, Scrap_Quantity: "0" },
  { ID: "4", Product_Master: { ID: "101", display_value: "Margherita Pizza" }, Scrap_Quantity: "0" },
];

const PRODUCTION_STOCK = [
  { ID: "1", Product_Master: { ID: "301", display_value: "Salt" }, Stock_On_Hand: "0", Committed_Stocks: "50" },
  { ID: "2", Product_Master: { ID: "302", display_value: "Olive Oil" }, Stock_On_Hand: "0", Committed_Stocks: "25" },
  { ID: "3", Product_Master: { ID: "303", display_value: "Yeast" }, Stock_On_Hand: "0", Committed_Stocks: "50" },
];

const SEQUENCE_MASTER = [
  {
    ID: "1",
    MRP_Name: "MRP-",
    MRP_No: "78",
    Order_Name: "PO-",
    Order_No: "11",
    Consumption_Name: "CNE-",
    Consumption_No: "21",
  },
];

const UOM_MASTER = [
  { ID: "401", UOM: "Kilogram" },
  { ID: "402", UOM: "Ltr" },
];

const WAREHOUSE_MASTER = [
  { ID: "1", Warehouse_Name: "Main Warehouse" },
];

const EMPLOYEES = [
  { ID: "1", Employee_ID: "EMP-001", Employee_Name: { prefix: "Mr.", first_name: "Sibi", last_name: "L" } },
  { ID: "2", Employee_ID: "EMP-002", Employee_Name: { prefix: "Ms.", first_name: "Anu", last_name: "R" } },
];

const REPORT_DATA: Record<string, any[]> = {
  [CONFIG.PRODUCTION_TARGET_REPORT]: PRODUCTION_TARGET,
  [CONFIG.MRP_REPORT]: MRP,
  [CONFIG.FINISHED_GOODS_REPORT]: FINISHED_GOODS,
  [CONFIG.RAW_MATERIALS_REPORT]: RAW_MATERIALS,
  [CONFIG.PURCHASE_ORDER_REPORT]: PURCHASE_ORDERS,
  [CONFIG.PURCHASE_RECEIVE_REPORT]: PURCHASE_RECEIVES,
  [CONFIG.PRODUCTION_INPROGRESS_REPORT]: PRODUCTION_INPROGRESS,
  [CONFIG.CONSUMPTION_ENTRY_REPORT]: CONSUMPTION_ENTRY,
  [CONFIG.FINISHED_GOODS_CONSUMPTIONS_REPORT]: FINISHED_GOODS_CONSUMPTIONS,
  [CONFIG.CONSUMPTION_ITEMS_REPORT]: CONSUMPTION_ITEMS,
  [CONFIG.BOM_MASTER_REPORT]: BOM_MASTER,
  [CONFIG.BOM_ITEMS_REPORT]: BOM_ITEMS,
  [CONFIG.MAIN_WAREHOUSE_STOCK_REPORT]: MAIN_WAREHOUSE_STOCK,
  [CONFIG.SCRAP_WAREHOUSE_STOCK_REPORT]: SCRAP_WAREHOUSE_STOCK,
  [CONFIG.PRODUCTION_STOCK_REPORT]: PRODUCTION_STOCK,
  [CONFIG.SEQUENCE_MASTER_REPORT]: SEQUENCE_MASTER,
  [CONFIG.WAREHOUSE_REPORT]: WAREHOUSE_MASTER,
  [CONFIG.UOM_MASTER_REPORT]: UOM_MASTER,
  [CONFIG.EMPLOYEE_REPORT]: EMPLOYEES,
};

export function installMockZoho() {
  window.ZOHO = {
    CREATOR: {
      DATA: {
        getRecords(params: { report_name: string; criteria?: string }) {
          const rows = REPORT_DATA[params.report_name] || [];
          return Promise.resolve({ code: 3000, data: rows });
        },
        addRecords(params: { form_name: string; payload: { data: any } }) {
          const newId = String(Date.now());
          const record = { ID: newId, ...params.payload.data };
          return Promise.resolve({ code: 3000, data: record });
        },
        updateRecordById(params: { report_name: string; id: string; payload: { data: any } }) {
          const rows = REPORT_DATA[params.report_name] || [];
          const target = rows.find((r) => String(r.ID) === String(params.id));
          if (target) {
            Object.assign(target, params.payload.data);
          }
          return Promise.resolve({ code: 3000, data: params.payload.data });
        },
      },
    },
  };
}



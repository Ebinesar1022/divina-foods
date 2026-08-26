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
    Notes: "Weekly batch — coconut chips, export line",
  },
];

const MRP = [
  {
    ID: "1",
    MRP_ID: "MRP-077",
    Production_Target_ID: DEMO_PT_ID,
    MRP_Date: "21-Aug-2026",
    Created_By45657: { id: "1", Deparment_Role: "Planner" },
    Notes: "Stock check completed",
    Status: "Released",
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

const REPORT_DATA: Record<string, any[]> = {
  [CONFIG.PRODUCTION_TARGET_REPORT]: PRODUCTION_TARGET,
  [CONFIG.MRP_REPORT]: MRP,
  [CONFIG.PURCHASE_ORDER_REPORT]: PURCHASE_ORDERS,
  [CONFIG.PURCHASE_RECEIVE_REPORT]: PURCHASE_RECEIVES,
  [CONFIG.PRODUCTION_INPROGRESS_REPORT]: PRODUCTION_INPROGRESS,
  [CONFIG.CONSUMPTION_ENTRY_REPORT]: CONSUMPTION_ENTRY,
};

export function installMockZoho() {
  window.ZOHO = {
    CREATOR: {
      DATA: {
        getRecords(params: { report_name: string; criteria?: string }) {
          const rows = REPORT_DATA[params.report_name] || [];
          return Promise.resolve({ code: 3000, data: rows });
        },
      },
    },
  };
}

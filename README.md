# Divina Foods — Production Overview Widget

Rebuild of the `Overview_Test` Zoho Creator page in React + TypeScript + MUI,
following the same stack and conventions as your other Creator widgets
(Vite build, `.then()` chains instead of async/await for iOS Safari
compatibility inside the Creator mobile app, a `CONFIG` object of report
link names, a single generic `getRecords()` fetcher).

## Reports / Forms this page needs

Your 5-stage pipeline maps to **6 Creator reports** (Procurement covers two
forms merged into one tab):

| Stage                          | Report (confirm link name in Creator → Reports) |
|---------------------------------|---------------------------------------------------|
| 1. Production Target            | `Production_Target_Report`                        |
| 2. Material Requirement & Planning (MRP) | `Material_Requirement_Planning_Report`    |
| 3. Procurement — Purchase Order | `Purchase_Order_Report`                            |
| 3. Procurement — Purchase Receive | `Purchase_Receive_Report`                        |
| 4. Production In-progress       | `Production_In_progress_Report`                    |
| 5. Consumption Entry            | `Consumption_Entry_Report`                         |

⚠️ These are best-guess names following Creator's default `<Form>_Report`
convention — **confirm each one against your actual report link names**
in `src/services/productionApi.ts` → `CONFIG`.

Each report is queried filtered by `Production_Target_ID` (the record's
lookup field back to the parent Production Target), except the Production
Target report itself which is looked up by its own ID field.

## Files

- `src/services/productionApi.ts` — all 6 report reads, `.then()`-chain
  pattern, generic `getRecords()` helper
- `src/config/stages.config.ts` — pipeline stage list, progress %, and
  stepper-state logic (handles the conditional Procurement skip)
- `src/components/ProjectHeader.tsx` — gradient hero + circular progress
- `src/components/PipelineStepper.tsx` — 5-node stepper, handles `skipped`
  state with dashed connector + muted label
- `src/components/ProductionOverview.tsx` — tabs, info cards, procurement
  PO/PR table with Type chips, skip banner
- `src/mocks/mockZoho.ts` — dev-only sample data so `npm run dev` renders
  without the Creator shell

## Before you run it

1. Confirm the 6 report link names in `CONFIG` (see table above).
2. Confirm field names on each report match what's read in
   `productionApi.ts` (e.g. `Production_Target_ID`, `Stock_Status`,
   `PO_No`, `PR_No`) — adjust if your actual field link names differ.
3. In `App.tsx`, swap the hardcoded `PRODUCTION_TARGET_ID` for
   `ZOHO.CREATOR.UTIL.getQueryParams()` (or however the record ID
   reaches this widget from the parent report) once wired into the
   real `Overview_Test` page.
4. `npm install && npm run dev` to preview locally with mock data;
   `npm run build` outputs to `dist/` for the Creator widget upload.

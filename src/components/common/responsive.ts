// Presentation-only helpers for the phone layout. Nothing in here touches
// data, state or handlers — components opt in through their `sx` props.

// Matches theme.breakpoints.down("sm"): every phone in portrait.
export const PHONE = "@media (max-width:599.95px)";

// Phones in portrait AND landscape phones (short viewport). Dialogs go
// full-screen here so their header/actions stay pinned and the form gets
// every pixel — a floating modal with 32px margins is unusable at 390x844,
// and worse still at 844x390.
export const COMPACT_VIEWPORT = "@media (max-width:599.95px), (max-height:500px)";

// Hover styles only where a real hover exists. On touch screens :hover
// "sticks" after a tap, leaving cards lifted / buttons shifted until the
// next tap elsewhere.
export const CAN_HOVER = "@media (hover: hover) and (pointer: fine)";

// ───────────── Full-screen dialogs ─────────────

// Spread into a Dialog's PaperProps.sx.
export const fullScreenDialogPaperSx = {
  [COMPACT_VIEWPORT]: {
    m: 0,
    width: "100%",
    maxWidth: "100%",
    height: "100%",
    maxHeight: "100%",
    borderRadius: 0,
  },
} as const;

// Spread into a DialogActions' sx. Cancel takes a third of the row, the
// primary action two thirds; the bar respects the iOS home-indicator inset.
export const fullScreenDialogActionsSx = {
  [COMPACT_VIEWPORT]: {
    px: 2,
    pt: 1.5,
    pb: "calc(12px + env(safe-area-inset-bottom))",
    borderTop: "1px solid rgba(148,163,184,0.25)",
    flexWrap: "nowrap",
    "& .MuiButton-root": { flex: 1, minWidth: 0, minHeight: 46 },
    "& .MuiButton-contained": { flex: 2 },
  },
} as const;

// ───────────── Wide tables → stacked cards on phones ─────────────
//
// A 7–9 column table can't be read (let alone edited) at 360px, and when its
// container clips instead of scrolling the extra columns are simply
// unreachable. Below the "sm" breakpoint each body row becomes a card:
//
//   • the first cell is the card title (product / item name)
//   • every other cell is a "LABEL / value" pair taken from its data-label
//   • cells sit two-per-row by default; add data-span="third" for three-per-row
//     or data-span="full" for a full-width cell (long inputs, chips)
//   • an optional leading padding="checkbox" cell is pinned to the card's
//     top-left corner, with the title indented beside it
//
// The <thead> is visually hidden (still in the DOM for assistive tech) —
// except a select-all checkbox, which stackedTableHeadControlSx keeps
// visible. Apply to a TableContainer's sx.
export const stackedTableSx = {
  [PHONE]: {
    // Chrome moves from the container onto each row card.
    border: 0,
    borderRadius: 0,
    boxShadow: "none",
    bgcolor: "transparent",
    backdropFilter: "none",
    WebkitBackdropFilter: "none",
    overflow: "visible",

    "& table, & tbody": { display: "block", minWidth: 0 },

    "& thead": {
      position: "absolute",
      width: "1px",
      height: "1px",
      overflow: "hidden",
      clip: "rect(0 0 0 0)",
      whiteSpace: "nowrap",
    },

    "& tbody tr": {
      position: "relative",
      display: "grid",
      gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
      columnGap: "12px",
      rowGap: "10px",
      p: 1.5,
      mb: 1.25,
      bgcolor: "#fff",
      border: "1px solid rgba(148,163,184,0.28)",
      borderRadius: "14px",
      boxShadow: "0 3px 12px rgba(15, 23, 42, 0.05)",
      "&:last-child": { mb: 0 },
    },

    "& tbody td": {
      display: "block",
      gridColumn: "span 3",
      minWidth: 0,
      p: 0,
      border: 0,
      textAlign: "left",
      fontSize: 13.5,
      overflowWrap: "anywhere",
    },
    "& tbody td[data-label]::before": {
      content: "attr(data-label)",
      display: "block",
      mb: "3px",
      fontSize: 10.5,
      fontWeight: 700,
      letterSpacing: "0.05em",
      textTransform: "uppercase",
      color: "#64748B",
    },
    "& tbody td[data-span='third']": { gridColumn: "span 2" },
    "& tbody td[data-span='full']": { gridColumn: "1 / -1" },

    // First cell = card title.
    "& tbody td:first-of-type": {
      gridColumn: "1 / -1",
      fontSize: 14.5,
      fontWeight: 700,
      color: "#0F172A",
    },
    // Empty-state rows ("No … found") are a single centred cell.
    "& tbody td.MuiTableCell-alignCenter": {
      gridColumn: "1 / -1",
      textAlign: "center",
      fontSize: 13,
      fontWeight: 400,
      color: "#94A3B8",
    },

    // Leading checkbox cell: pinned top-left, title indented beside it.
    // (p: 0 must be explicit here — MUI's size="small" checkbox cell carries its
    // own "0 12px 0 16px" padding rule that outranks the generic td reset.)
    // gridColumn must reset to auto: any explicit placement (the generic "span 3")
    // makes the grid *area* this cell's containing block, so left:12px would be
    // measured from inside the row's padding instead of from the card edge.
    "& tbody td.MuiTableCell-paddingCheckbox": {
      position: "absolute",
      top: 12,
      left: 12,
      width: "auto",
      gridColumn: "auto",
      p: 0,
      fontSize: 13.5,
    },
    "& tbody td.MuiTableCell-paddingCheckbox + td": {
      gridColumn: "1 / -1",
      pl: "32px",
      minHeight: 22,
      fontSize: 14.5,
      fontWeight: 700,
      color: "#0F172A",
    },

    // Inputs fill their grid cell instead of keeping desktop pixel widths.
    "& tbody td .MuiTextField-root": { width: "100%" },

    // Under 360px a half-width cell (~120px) truncates date inputs, so every
    // value cell takes a full row. (Only the 320px class of phone lands here.)
    "@media (max-width:359.95px)": {
      "& tbody td:not(.MuiTableCell-paddingCheckbox)": { gridColumn: "1 / -1" },
    },
  },
} as const;

// Layer on top of stackedTableSx for tables whose <thead> holds a working
// control (the Receive dialog's select-all checkbox) so it stays reachable.
export const stackedTableHeadControlSx = {
  [PHONE]: {
    "& thead": {
      position: "static",
      width: "auto",
      height: "auto",
      overflow: "visible",
      clip: "auto",
      display: "block",
    },
    "& thead tr": {
      display: "flex",
      alignItems: "center",
      p: 1.25,
      mb: 1.25,
      borderRadius: "12px",
      bgcolor: "rgba(241,245,249,0.9)",
      border: "1px solid rgba(148,163,184,0.25)",
    },
    "& thead th": { display: "none" },
    "& thead th.MuiTableCell-paddingCheckbox": {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      p: 0,
      border: 0,
      width: "auto",
      bgcolor: "transparent",
      textTransform: "none",
      letterSpacing: 0,
      fontSize: 13,
      fontWeight: 700,
      color: "#334155",
      "&::after": { content: "attr(data-label)" },
    },
  },
} as const;

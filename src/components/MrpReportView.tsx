import {
  Alert,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import StickyNote2OutlinedIcon from "@mui/icons-material/StickyNote2Outlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import StatusChip from "./StatusChip";
import FoodProductionLoader from "./FoodProductionLoader";
import type { MrpDetailData, MrpRow, ProductionTargetRow } from "../types";

interface MrpReportViewProps {
  mrpRecord: MrpRow;
  mrpDetails?: MrpDetailData | null;
  productionTarget: ProductionTargetRow;
  loading?: boolean;
}

export default function MrpReportView({
  mrpRecord,
  mrpDetails,
  productionTarget,
  loading = false,
}: MrpReportViewProps) {
  const finishedGoods = mrpDetails?.finishedGoods || [];
  const rawMaterials = mrpDetails?.rawMaterials || [];
  const hasShortfall =
    mrpDetails?.hasShortfall ??
    (rawMaterials.some((r) => r.status === "Needs Purchase") ||
      productionTarget.status === "Waiting for Stock");

  const totalRawItems = rawMaterials.length;
  const needsPurchaseCount = rawMaterials.filter((r) => r.status === "Needs Purchase").length;
  const inStockCount = totalRawItems - needsPurchaseCount;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Header Banner */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 2.5 },
          borderRadius: "14px",
          border: "1px solid #E2E8F0",
          background: "linear-gradient(135deg, #F8FAFC 0%, #FFFFFF 100%)",
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: "12px",
              background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(37, 99, 235, 0.2)",
            }}
          >
            <AssignmentTurnedInIcon sx={{ fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#0F172A", lineHeight: 1.2 }}>
              Material Requirement &amp; Planning Report
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 500 }}>
              Computed materials breakdown and allocation summary
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              px: 1.5,
              py: 0.5,
              borderRadius: "8px",
              bgcolor: "#EEF2FF",
              color: "#3730A3",
              fontSize: 13,
              fontWeight: 700,
              border: "1px solid #C7D2FE",
            }}
          >
            {mrpRecord.mrpId || "MRP"}
          </Box>
          <StatusChip value={productionTarget.status} />
        </Box>
      </Paper>

      {/* Info Metric Cards */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
          gap: 2,
        }}
      >
        <MetricCard label="MRP ID" value={mrpRecord.mrpId} highlight />
        <MetricCard label="MRP Date" value={mrpRecord.date || "—"} />
        <MetricCard label="Production Target" value={productionTarget.productionTargetId} />
        <MetricCard
          label="Target Status"
          valueNode={<StatusChip value={productionTarget.status} />}
        />
      </Box>

      {/* Optional Notes */}
      {mrpRecord.notes && (
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: "12px",
            bgcolor: "#F8FAFC",
            borderColor: "#E2E8F0",
            display: "flex",
            alignItems: "flex-start",
            gap: 1.5,
          }}
        >
          <StickyNote2OutlinedIcon sx={{ color: "#64748B", mt: 0.25 }} />
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Notes
            </Typography>
            <Typography sx={{ fontSize: 14, color: "#1E293B", mt: 0.25 }}>
              {mrpRecord.notes}
            </Typography>
          </Box>
        </Paper>
      )}

      {/* Material Status Banner */}
      {hasShortfall ? (
        <Alert
          severity="warning"
          icon={<WarningAmberRoundedIcon sx={{ fontSize: 24 }} />}
          sx={{
            borderRadius: "12px",
            border: "1px solid #FDE68A",
            backgroundColor: "#FFFBEB",
            "& .MuiAlert-message": { width: "100%" },
          }}
        >
          <Typography sx={{ fontWeight: 700, color: "#92400E", fontSize: 14 }}>
            Procurement Required — Stock Shortage Detected
          </Typography>
          <Typography sx={{ color: "#B45309", fontSize: 13, mt: 0.25 }}>
            Some raw materials have insufficient stock on hand. Purchase orders need to be raised
            to fulfill this production target.
          </Typography>
        </Alert>
      ) : (
        <Alert
          severity="success"
          icon={<CheckCircleOutlineIcon sx={{ fontSize: 24 }} />}
          sx={{
            borderRadius: "12px",
            border: "1px solid #A7F3D0",
            backgroundColor: "#ECFDF5",
            "& .MuiAlert-message": { width: "100%" },
          }}
        >
          <Typography sx={{ fontWeight: 700, color: "#065F46", fontSize: 14 }}>
            All Raw Materials In Stock
          </Typography>
          <Typography sx={{ color: "#047857", fontSize: 13, mt: 0.25 }}>
            All required raw materials are available and allocated from the Main Warehouse. Target is
            ready for production.
          </Typography>
        </Alert>
      )}

      {loading && !mrpDetails ? (
        <FoodProductionLoader
          size="small"
          text="Loading Material Breakdown…"
          subtext="Calculating stock and requirement allocations"
        />
      ) : (
        <>
          {/* Finished Goods Section */}
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <Inventory2OutlinedIcon sx={{ color: "#2563eb", fontSize: 20 }} />
              <Typography sx={{ fontWeight: 700, color: "#0F172A", fontSize: 16 }}>
                Finished Goods
              </Typography>
              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 600,
                  bgcolor: "#EFF6FF",
                  color: "#2563eb",
                  px: 1,
                  py: 0.2,
                  borderRadius: "6px",
                }}
              >
                {finishedGoods.length} {finishedGoods.length === 1 ? "Item" : "Items"}
              </Typography>
            </Box>

            <TableContainer
              component={Paper}
              variant="outlined"
              sx={{
                borderRadius: "12px",
                borderColor: "#E2E8F0",
                overflow: "hidden",
              }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                    <TableCell sx={{ fontWeight: 700, color: "#475569", py: 1.2 }}>Item</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#475569", py: 1.2 }}>UOM</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: "#475569", py: 1.2 }}>
                      Target Quantity
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {finishedGoods.length > 0 ? (
                    finishedGoods.map((fg, idx) => (
                      <TableRow
                        key={fg.id || idx}
                        sx={{
                          "&:last-child td, &:last-child th": { border: 0 },
                          "&:hover": { bgcolor: "#F8FAFC" },
                        }}
                      >
                        <TableCell sx={{ fontWeight: 600, color: "#1E293B" }}>
                          {fg.itemName}
                        </TableCell>
                        <TableCell sx={{ color: "#64748B" }}>{fg.uomName}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: "#0F172A" }}>
                          {fg.targetQuantity}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ py: 3, color: "#94A3B8" }}>
                        No finished goods found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Raw Materials Section */}
          <Box>
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1.5,
                mb: 1.5,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <LayersOutlinedIcon sx={{ color: "#2563eb", fontSize: 20 }} />
                <Typography sx={{ fontWeight: 700, color: "#0F172A", fontSize: 16 }}>
                  Raw Materials Breakdown
                </Typography>
                <Typography
                  sx={{
                    fontSize: 12,
                    fontWeight: 600,
                    bgcolor: "#EFF6FF",
                    color: "#2563eb",
                    px: 1,
                    py: 0.2,
                    borderRadius: "6px",
                  }}
                >
                  {totalRawItems} {totalRawItems === 1 ? "Item" : "Items"}
                </Typography>
              </Box>

              {totalRawItems > 0 && (
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Box
                    sx={{
                      px: 1.2,
                      py: 0.3,
                      borderRadius: "6px",
                      bgcolor: "#ECFDF5",
                      color: "#059669",
                      fontSize: 11.5,
                      fontWeight: 700,
                    }}
                  >
                    In Stock: {inStockCount}
                  </Box>
                  {needsPurchaseCount > 0 && (
                    <Box
                      sx={{
                        px: 1.2,
                        py: 0.3,
                        borderRadius: "6px",
                        bgcolor: "#FEF2F2",
                        color: "#DC2626",
                        fontSize: 11.5,
                        fontWeight: 700,
                      }}
                    >
                      Needs Purchase: {needsPurchaseCount}
                    </Box>
                  )}
                </Box>
              )}
            </Box>

            <TableContainer
              component={Paper}
              variant="outlined"
              sx={{
                borderRadius: "12px",
                borderColor: "#E2E8F0",
                overflow: "hidden",
              }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                    <TableCell sx={{ fontWeight: 700, color: "#475569", py: 1.2 }}>
                      Product Name
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#475569", py: 1.2 }}>UOM</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: "#475569", py: 1.2 }}>
                      Stock On Hand
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: "#475569", py: 1.2 }}>
                      Stock Required
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: "#475569", py: 1.2 }}>
                      Allocate Qty
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: "#475569", py: 1.2 }}>
                      Needed Qty
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#475569", py: 1.2 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rawMaterials.length > 0 ? (
                    rawMaterials.map((rm, idx) => {
                      const isShortfall = rm.status === "Needs Purchase";
                      return (
                        <TableRow
                          key={rm.productId || idx}
                          sx={{
                            bgcolor: isShortfall ? "rgba(254, 242, 242, 0.4)" : undefined,
                            "&:last-child td, &:last-child th": { border: 0 },
                            "&:hover": {
                              bgcolor: isShortfall ? "rgba(254, 242, 242, 0.7)" : "#F8FAFC",
                            },
                          }}
                        >
                          <TableCell sx={{ fontWeight: 600, color: "#1E293B" }}>
                            {rm.productName}
                          </TableCell>
                          <TableCell sx={{ color: "#64748B" }}>{rm.uom}</TableCell>
                          <TableCell align="right" sx={{ color: "#334155" }}>
                            {rm.stockOnHand.toFixed(2)}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, color: "#1E293B" }}>
                            {rm.stockRequired.toFixed(2)}
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{ color: rm.allocateQuantity > 0 ? "#059669" : "#64748B" }}
                          >
                            {rm.allocateQuantity.toFixed(2)}
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              fontWeight: rm.neededQuantity > 0 ? 700 : 400,
                              color: rm.neededQuantity > 0 ? "#DC2626" : "#64748B",
                            }}
                          >
                            {rm.neededQuantity.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <StatusChip value={rm.status} />
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 3, color: "#94A3B8" }}>
                        No raw materials calculation found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </>
      )}
    </Box>
  );
}

function MetricCard({
  label,
  value,
  valueNode,
  highlight = false,
}: {
  label: string;
  value?: string;
  valueNode?: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.75,
        borderRadius: "12px",
        bgcolor: "#fff",
        borderColor: highlight ? "#C7D2FE" : "#E2E8F0",
        boxShadow: highlight ? "0 2px 8px rgba(99, 102, 241, 0.08)" : "none",
        transition: "all 0.2s ease",
        "&:hover": {
          borderColor: "#CBD5E1",
        },
      }}
    >
      <Typography sx={{ fontSize: 11.5, color: "#64748B", fontWeight: 600, mb: 0.5 }}>
        {label}
      </Typography>
      {valueNode || (
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: 15,
            color: highlight ? "#1E3A8A" : "#0F172A",
          }}
        >
          {value || "—"}
        </Typography>
      )}
    </Paper>
  );
}

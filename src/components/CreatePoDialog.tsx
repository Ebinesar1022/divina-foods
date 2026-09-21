import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ShoppingCartCheckoutIcon from "@mui/icons-material/ShoppingCartCheckout";
import PoCreationLoader from "./loaders/PoCreationLoader";
import {
  fullScreenDialogActionsSx,
  fullScreenDialogPaperSx,
  stackedTableSx,
} from "./common/responsive";
import type { CreatePoDraft, PaymentTermOption, PoLineDraftRow, SupplierOption, TaxOption } from "../types";

interface CreatePoDialogProps {
  open: boolean;
  draft: CreatePoDraft | null;
  draftError: string;
  committing: boolean;
  commitError: string;
  suppliers: SupplierOption[];
  paymentTerms: PaymentTermOption[];
  taxTypes: TaxOption[];
  onDraftChange: (draft: CreatePoDraft) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

function lineTotalFor(line: PoLineDraftRow): number {
  return line.orderQuantity * line.unitPrice;
}

function taxAmountFor(line: PoLineDraftRow): number {
  return (lineTotalFor(line) * line.taxPercentage) / 100;
}

export default function CreatePoDialog({
  open,
  draft,
  draftError,
  committing,
  commitError,
  suppliers,
  paymentTerms,
  taxTypes,
  onDraftChange,
  onCancel,
  onConfirm,
}: CreatePoDialogProps) {
  const isPreparing = !draft && !draftError;

  function updateLine(index: number, patch: Partial<PoLineDraftRow>) {
    if (!draft) return;
    const lines = draft.lines.slice();
    const row = { ...lines[index], ...patch };
    if (patch.orderQuantity !== undefined && (isNaN(row.orderQuantity) || row.orderQuantity < 0)) {
      row.orderQuantity = 0;
    }
    if (patch.unitPrice !== undefined && (isNaN(row.unitPrice) || row.unitPrice < 0)) {
      row.unitPrice = 0;
    }
    if (patch.taxTypeId !== undefined) {
      // Auto-fill the rate from the selected tax type — still editable
      // afterward, same as the native form's Tax_Percentage field.
      const selectedTax = taxTypes.find((t) => t.id === patch.taxTypeId);
      row.taxPercentage = selectedTax ? selectedTax.rate : 0;
    }
    if (patch.taxPercentage !== undefined && (isNaN(row.taxPercentage) || row.taxPercentage < 0)) {
      row.taxPercentage = 0;
    }
    lines[index] = row;
    onDraftChange({ ...draft, lines });
  }

  const subTotal = draft ? draft.lines.reduce((sum, l) => sum + lineTotalFor(l), 0) : 0;
  const taxTotal = draft ? draft.lines.reduce((sum, l) => sum + taxAmountFor(l), 0) : 0;
  const grandTotal = subTotal + taxTotal;
  const deliveryBeforePo =
    !!draft && !!draft.poDate && !!draft.expectedDeliveryDate && draft.expectedDeliveryDate < draft.poDate;
  const canSubmit =
    !!draft &&
    !!draft.supplierId &&
    !!draft.paymentTermsId &&
    !!draft.expectedDeliveryDate &&
    !deliveryBeforePo &&
    draft.lines.every((l) => l.orderQuantity > 0 && l.orderQuantity >= l.neededQuantity && l.unitPrice > 0);

  return (
    <Dialog
      open={open}
      onClose={committing ? undefined : onCancel}
      fullWidth
      maxWidth="lg"
      PaperProps={{
        sx: {
          position: "relative",
          borderRadius: "22px",
          overflow: "hidden",
          boxShadow: "0 24px 60px rgba(15, 23, 42, 0.22)",
          ...fullScreenDialogPaperSx,
        },
      }}
    >
      <Box
        sx={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #4338ca 50%, #6366f1 100%)",
          color: "#fff",
          px: { xs: 2, sm: 3 },
          py: { xs: 1.75, sm: 2.5 },
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1.25, sm: 1.5 }, minWidth: 0 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              flexShrink: 0,
              borderRadius: "10px",
              bgcolor: "rgba(255, 255, 255, 0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(8px)",
            }}
          >
            <ShoppingCartCheckoutIcon sx={{ fontSize: 22 }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2, fontSize: { xs: 16, sm: 17 } }}>
              Create Purchase Order
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)", fontSize: { xs: 12, sm: 12.5 } }}>
              For the selected shortfall items
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onCancel} disabled={committing} sx={{ color: "#fff", flexShrink: 0 }} aria-label="Close">
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: { xs: 2, sm: 3 }, bgcolor: "#F8FAFC" }}>
        {isPreparing && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        )}

        {draftError && (
          <Alert severity="error" sx={{ borderRadius: "12px" }}>
            {draftError}
          </Alert>
        )}

        {draft && (
          <>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2, mb: 2.5 }}>
              <FieldCard label="PO Number" value={draft.poNumber} />
              <Autocomplete
                fullWidth
                options={suppliers}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                value={suppliers.find((s) => s.id === draft.supplierId) || null}
                onChange={(_e, newValue) =>
                  onDraftChange({ ...draft, supplierId: newValue ? newValue.id : "" })
                }
                disabled={committing}
                renderInput={(params) => (
                  <TextField {...params} label="Supplier" sx={{ bgcolor: "#fff", borderRadius: "10px" }} />
                )}
              />
              <Autocomplete
                fullWidth
                options={paymentTerms}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                value={paymentTerms.find((p) => p.id === draft.paymentTermsId) || null}
                onChange={(_e, newValue) =>
                  onDraftChange({ ...draft, paymentTermsId: newValue ? newValue.id : "" })
                }
                disabled={committing}
                renderInput={(params) => (
                  <TextField {...params} label="Payment Terms" sx={{ bgcolor: "#fff", borderRadius: "10px" }} />
                )}
              />
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" }, gap: 2, mb: 2.5 }}>
              <TextField
                label="PO Date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={draft.poDate}
                onChange={(e) => onDraftChange({ ...draft, poDate: e.target.value })}
                disabled={committing}
                sx={{ bgcolor: "#fff", borderRadius: "10px" }}
              />
              <TextField
                label="Expected Delivery Date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={draft.expectedDeliveryDate}
                onChange={(e) => onDraftChange({ ...draft, expectedDeliveryDate: e.target.value })}
                disabled={committing}
                error={deliveryBeforePo}
                helperText={deliveryBeforePo ? "Can't be before the PO Date" : " "}
                inputProps={{ min: draft.poDate || undefined }}
                sx={{ bgcolor: "#fff", borderRadius: "10px" }}
              />
            </Box>

            <Typography sx={{ fontWeight: 700, mb: 1 }}>Line Items</Typography>
            <TableContainer component={Paper} variant="outlined" sx={[{ borderRadius: "12px", mb: 2 }, stackedTableSx]}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ "& th": { fontWeight: 700, bgcolor: "#F1F5F9" } }}>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Needed Qty</TableCell>
                    <TableCell align="right" sx={{ minWidth: 90 }}>
                      Order Qty
                    </TableCell>
                    <TableCell align="right" sx={{ minWidth: 100 }}>
                      Unit Price
                    </TableCell>
                    <TableCell align="right">Line Total</TableCell>
                    <TableCell sx={{ minWidth: 140 }}>Tax Type</TableCell>
                    <TableCell align="right" sx={{ minWidth: 90 }}>
                      Tax %
                    </TableCell>
                    <TableCell align="right">Tax Amt</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {draft.lines.map((line, index) => {
                    const lineTotal = lineTotalFor(line);
                    const taxAmount = taxAmountFor(line);
                    return (
                      <TableRow key={line.nonStockItemId}>
                        <TableCell>
                          {line.productName}
                          {line.uomName && (
                            <Typography component="span" sx={{ fontSize: 12, color: "#94A3B8", ml: 0.5 }}>
                              ({line.uomName})
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right" data-label="Needed Qty">{line.neededQuantity}</TableCell>
                        <TableCell align="right" data-label="Order Qty">
                          <TextField
                            type="number"
                            size="small"
                            value={line.orderQuantity}
                            disabled={committing}
                            onChange={(e) => updateLine(index, { orderQuantity: parseFloat(e.target.value) })}
                            onBlur={(e) => {
                              const value = parseFloat(e.target.value);
                              if (isNaN(value) || value < line.neededQuantity) {
                                updateLine(index, { orderQuantity: line.neededQuantity });
                              }
                            }}
                            error={isNaN(line.orderQuantity) || line.orderQuantity < line.neededQuantity}
                            helperText={
                              isNaN(line.orderQuantity) || line.orderQuantity < line.neededQuantity
                                ? `Min ${line.neededQuantity}`
                                : " "
                            }
                            inputProps={{ min: line.neededQuantity, style: { textAlign: "right" } }}
                            sx={{ bgcolor: "#fff", borderRadius: "8px", width: 90 }}
                          />
                        </TableCell>
                        <TableCell align="right" data-label="Unit Price">
                          <TextField
                            type="number"
                            size="small"
                            value={line.unitPrice}
                            disabled={committing}
                            onChange={(e) => updateLine(index, { unitPrice: parseFloat(e.target.value) })}
                            inputProps={{ min: 0, step: "0.01", style: { textAlign: "right" } }}
                            helperText=" "
                            sx={{ bgcolor: "#fff", borderRadius: "8px", width: 100 }}
                          />
                        </TableCell>
                        <TableCell align="right" data-label="Line Total">{lineTotal.toFixed(2)}</TableCell>
                        <TableCell data-label="Tax Type">
                          <TextField
                            select
                            size="small"
                            fullWidth
                            value={line.taxTypeId}
                            disabled={committing}
                            onChange={(e) => updateLine(index, { taxTypeId: e.target.value })}
                            sx={{ bgcolor: "#fff", borderRadius: "8px" }}
                          >
                            <MenuItem value="">
                              <em>No Tax</em>
                            </MenuItem>
                            {taxTypes.map((t) => (
                              <MenuItem key={t.id} value={t.id}>
                                {t.name} ({t.rate}%)
                              </MenuItem>
                            ))}
                          </TextField>
                        </TableCell>
                        <TableCell align="right" data-label="Tax %">
                          <TextField
                            type="number"
                            size="small"
                            value={line.taxPercentage}
                            disabled={committing}
                            onChange={(e) => updateLine(index, { taxPercentage: parseFloat(e.target.value) })}
                            inputProps={{ min: 0, step: "0.01", style: { textAlign: "right" } }}
                            sx={{ bgcolor: "#fff", borderRadius: "8px", width: 80 }}
                          />
                        </TableCell>
                        <TableCell align="right" data-label="Tax Amt">{taxAmount.toFixed(2)}</TableCell>
                        <TableCell align="right" data-label="Total" sx={{ fontWeight: 600 }}>
                          {(lineTotal + taxAmount).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
              <Box sx={{ minWidth: { xs: "100%", sm: 220 } }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography sx={{ fontSize: 13.5, color: "#64748B" }}>Sub Total</Typography>
                  <Typography sx={{ fontSize: 13.5 }}>{subTotal.toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography sx={{ fontSize: 13.5, color: "#64748B" }}>Tax</Typography>
                  <Typography sx={{ fontSize: 13.5 }}>{taxTotal.toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", pt: 0.5, borderTop: "1px solid #E2E8F0" }}>
                  <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Grand Total</Typography>
                  <Typography sx={{ fontWeight: 700, fontSize: 16 }}>{grandTotal.toFixed(2)}</Typography>
                </Box>
              </Box>
            </Box>

            {commitError && (
              <Alert severity="error" sx={{ borderRadius: "12px", mt: 1 }}>
                {commitError}
              </Alert>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, bgcolor: "#F8FAFC", ...fullScreenDialogActionsSx }}>
        <Button
          onClick={onCancel}
          disabled={committing}
          variant="outlined"
          sx={{ borderRadius: "10px", textTransform: "none" }}
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          disabled={!canSubmit || committing}
          variant="contained"
          startIcon={committing ? <CircularProgress size={16} color="inherit" /> : <ShoppingCartCheckoutIcon />}
          sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700 }}
        >
          {committing ? "Creating…" : "Create Purchase Order"}
        </Button>
      </DialogActions>

      {committing && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 100,
            bgcolor: "rgba(245, 243, 255, 0.97)",
            backdropFilter: "blur(14px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            p: { xs: 1.5, sm: 3 },
            overflowY: "auto",
            animation: "poOverlayFadeIn 0.25s ease-out",
            "@keyframes poOverlayFadeIn": {
              from: { opacity: 0, transform: "scale(0.98)" },
              to: { opacity: 1, transform: "scale(1)" },
            },
          }}
        >
          <PoCreationLoader />
        </Box>
      )}
    </Dialog>
  );
}

function FieldCard({ label, value }: { label: string; value: string }) {
  return (
    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: "12px", bgcolor: "#fff" }}>
      <Typography sx={{ fontSize: 12, color: "text.secondary", mb: 0.5 }}>{label}</Typography>
      <Typography sx={{ fontWeight: 600 }}>{value || "—"}</Typography>
    </Paper>
  );
}

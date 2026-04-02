import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TableCell,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { productService } from 'src/services/product.service';
import { quoteService } from 'src/services/quote.service';
import type { Product } from 'src/types/product.types';
import type { Quote, QuoteItem, QuoteStatus } from 'src/types/quote.types';
import { AdminDataTable, type AdminColumnDef } from 'src/components/admin/AdminDataTable';
import { CotizacionFormalDocument, formatMoney } from 'src/components/cotizacion/CotizacionFormalDocument';
import { docTableCellSx } from 'src/components/cotizacion/cotizacion-formal-styles';
import { COTIZACION_UNIDAD_DEFAULT } from 'src/constants/cotizacion-document';

const FEE_MARGIN_OPTIONS = [0, 5, 10, 15, 20, 25, 30] as const;

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function itemUnidad(item: QuoteItem) {
  const c = item.product?.category?.trim() || item.manualCategory?.trim();
  return c && c.length > 0 ? c.toUpperCase() : COTIZACION_UNIDAD_DEFAULT;
}

function isManualLine(item: QuoteItem) {
  return item.lineKind === 'manual' || item.productId == null;
}

function recalcTotals(items: QuoteItem[], includeIva: boolean) {
  const subtotal = items.reduce((s, it) => s + it.subtotal, 0);
  const tax = includeIva ? round2(subtotal * 0.16) : 0;
  return { subtotal, tax, total: subtotal + tax };
}

function normalizeQuantity(qty: unknown): number {
  const n = Number(qty);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

function lineSubtotal(quantity: number, unitPrice: number, discount: number) {
  return round2(quantity * unitPrice - discount);
}

/** Coerce quantities to integers and fix subtotals (e.g. after loading from API). */
function normalizeQuoteItemsForEdit(items: QuoteItem[]): QuoteItem[] {
  return items.map((it) => {
    const quantity = normalizeQuantity(it.quantity);
    const discount = Number(it.discount) || 0;
    return {
      ...it,
      quantity,
      subtotal: lineSubtotal(quantity, it.unitPrice, discount),
    };
  });
}

function itemsForApi(items: QuoteItem[]) {
  return items.map((it) => {
    const manual = isManualLine(it);
    const name = manual ? String(it.manualName ?? it.product?.name ?? '').trim() : '';
    if (manual && !name) {
      throw new Error('Cada partida manual necesita un concepto (nombre).');
    }
    return {
      ...(it.id != null ? { id: it.id } : {}),
      lineKind: manual ? ('manual' as const) : ('product' as const),
      productId: manual ? null : it.productId,
      manualCode: manual ? (it.manualCode || it.product?.code || null) : null,
      manualName: manual ? name : null,
      manualCategory: manual ? (it.manualCategory || it.product?.category || null) : null,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      discount: it.discount ?? 0,
      subtotal: it.subtotal,
      notes: it.notes ?? null,
    };
  });
}

export function TiwaterQuotesAdminPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [includeIva, setIncludeIva] = useState(true);
  const includeIvaRef = useRef(true);
  const [feeMarginPct, setFeeMarginPct] = useState<number>(0);
  const [catalogDialogOpen, setCatalogDialogOpen] = useState(false);

  useEffect(() => {
    void Promise.all([fetchQuotes(), fetchProducts()]);
  }, []);

  const catalogPriceByProduct = useMemo(() => {
    const map = new Map<number, number>();
    products.forEach((product) => map.set(product.id, Number(product.price || 0)));
    return map;
  }, [products]);

  const catalogFirstImageByProductId = useMemo(() => {
    const map = new Map<number, string>();
    products.forEach((p) => {
      const first = p.images?.[0];
      if (first) map.set(p.id, first);
    });
    return map;
  }, [products]);

  const productImageForItem = (item: QuoteItem) =>
    item.product?.images?.[0] || catalogFirstImageByProductId.get(item.productId ?? -1) || '';

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const response = await quoteService.getAll({ limit: 500, offset: 0 });
      setQuotes(response.quotes || []);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al cargar cotizaciones');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productService.getAll({ isActive: true, limit: 500 });
      setProducts(response.products || []);
    } catch {
      /* optional */
    }
  };

  useEffect(() => {
    if (!editingQuote?.items) return;
    const st = editingQuote.items.reduce((s, i) => s + i.subtotal, 0);
    const tx = Number(editingQuote.tax ?? 0);
    const next = !(st > 0 && tx === 0);
    setIncludeIva(next);
    includeIvaRef.current = next;
  }, [editingQuote?.id]);

  useEffect(() => {
    includeIvaRef.current = includeIva;
  }, [includeIva]);

  const mergeQuoteWithRecalc = useCallback(
    (base: Quote, items: QuoteItem[], iva: boolean) => {
      const { subtotal, tax, total } = recalcTotals(items, iva);
      return { ...base, items, subtotal, tax, total };
    },
    [],
  );

  const updateItem = (
    index: number,
    field: 'quantity' | 'unitPrice' | 'discount' | 'notes',
    value: number | string,
  ) => {
    if (!editingQuote?.items) return;
    const items = [...editingQuote.items];
    const item = { ...items[index] };
    if (field === 'notes') item.notes = String(value);
    if (field === 'quantity') item.quantity = normalizeQuantity(value);
    if (field === 'unitPrice') item.unitPrice = Number(value);
    if (field === 'discount') item.discount = Number(value);
    item.subtotal = lineSubtotal(item.quantity, item.unitPrice, item.discount || 0);
    items[index] = item;
    setEditingQuote(mergeQuoteWithRecalc(editingQuote, items, includeIva));
  };

  const updateManualFields = (index: number, patch: Partial<Pick<QuoteItem, 'manualCode' | 'manualName' | 'manualCategory'>>) => {
    if (!editingQuote?.items) return;
    const items = [...editingQuote.items];
    const item = { ...items[index], ...patch };
    item.product = {
      code: patch.manualCode !== undefined ? patch.manualCode : item.product?.code ?? '',
      name: patch.manualName !== undefined ? patch.manualName : item.product?.name ?? '',
      description: item.product?.description,
      category: patch.manualCategory !== undefined ? patch.manualCategory : item.product?.category,
      images: item.product?.images,
    };
    items[index] = item;
    setEditingQuote({ ...editingQuote, items });
  };

  const resetCatalogPrice = (index: number) => {
    if (!editingQuote?.items) return;
    const item = editingQuote.items[index];
    if (isManualLine(item) || item.productId == null) return;
    const list = item.catalogListPrice ?? catalogPriceByProduct.get(item.productId) ?? 0;
    updateItem(index, 'unitPrice', list);
  };

  const applyMarginPctToItems = useCallback(
    (items: QuoteItem[], marginPct: number, iva: boolean, baseQuote: Quote) => {
      const next = items.map((it) => {
        if (isManualLine(it) || it.productId == null) return it;
        const list = it.catalogListPrice ?? catalogPriceByProduct.get(it.productId) ?? 0;
        const unitPrice = round2(list * (1 + marginPct / 100));
        const subtotal = lineSubtotal(it.quantity, unitPrice, it.discount || 0);
        return { ...it, catalogListPrice: list, unitPrice, subtotal };
      });
      return mergeQuoteWithRecalc(baseQuote, next, iva);
    },
    [catalogPriceByProduct, mergeQuoteWithRecalc],
  );

  const handleFeeMarginChange = (nextMargin: number) => {
    setFeeMarginPct(nextMargin);
    setEditingQuote((prev) => {
      if (!prev?.items?.length) return prev;
      return applyMarginPctToItems(prev.items, nextMargin, includeIvaRef.current, prev);
    });
  };

  const removeItem = (index: number) => {
    if (!editingQuote?.items) return;
    const items = editingQuote.items.filter((_, i) => i !== index);
    setEditingQuote(mergeQuoteWithRecalc(editingQuote, items, includeIva));
  };

  const addProductLine = (product: Product) => {
    if (!editingQuote) return;
    const list = Number(product.price || 0);
    const unitPrice = round2(list * (1 + feeMarginPct / 100));
    const newItem: QuoteItem = {
      lineKind: 'product',
      productId: product.id,
      catalogListPrice: list,
      product: {
        code: product.code,
        name: product.name,
        description: product.description,
        category: product.category,
        images: product.images,
      },
      quantity: 1,
      unitPrice,
      discount: 0,
      subtotal: unitPrice,
      notes: '',
    };
    const items = [...(editingQuote.items || []), newItem];
    setEditingQuote(mergeQuoteWithRecalc(editingQuote, items, includeIva));
    setCatalogDialogOpen(false);
  };

  const addManualLine = () => {
    if (!editingQuote) return;
    const newItem: QuoteItem = {
      lineKind: 'manual',
      productId: null,
      manualCode: '',
      manualName: '',
      manualCategory: 'SERVICIO',
      product: { code: '', name: '', description: '', category: 'SERVICIO' },
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      subtotal: 0,
      notes: '',
    };
    const items = [...(editingQuote.items || []), newItem];
    setEditingQuote(mergeQuoteWithRecalc(editingQuote, items, includeIva));
  };

  const setIncludeIvaAndRecalc = (next: boolean) => {
    includeIvaRef.current = next;
    setIncludeIva(next);
    if (!editingQuote?.items) return;
    setEditingQuote(mergeQuoteWithRecalc(editingQuote, editingQuote.items, next));
  };

  const respondQuote = async () => {
    if (!editingQuote?.id || !editingQuote.items) return;
    setSaving(true);
    setError(null);
    try {
      const payloadItems = itemsForApi(editingQuote.items);
      const subtotal = editingQuote.items.reduce((sum, item) => sum + item.subtotal, 0);
      const tax = Number(editingQuote.tax || 0);
      await quoteService.update(editingQuote.id, {
        items: payloadItems as QuoteItem[],
        notes: editingQuote.notes,
        subtotal,
        tax,
        total: subtotal + tax,
        status: 'enviada' as QuoteStatus,
      });
      setEditingQuote(null);
      await fetchQuotes();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al responder cotización');
    } finally {
      setSaving(false);
    }
  };

  const bulkMarkEnviada = async (rows: Quote[]) => {
    if (
      !window.confirm(
        `¿Marcar ${rows.length} cotización(es) como enviada(s)? Revisa precios antes si aplica.`,
      )
    ) {
      return;
    }
    setError(null);
    try {
      await Promise.all(
        rows.map((q) =>
          quoteService.update(q.id!, {
            status: 'enviada' as QuoteStatus,
          }),
        ),
      );
      await fetchQuotes();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error en actualización masiva');
    }
  };

  const columns: AdminColumnDef<Quote>[] = [
    {
      id: 'folio',
      header: 'Folio',
      cell: (q) => q.quoteNumber,
    },
    {
      id: 'client',
      header: 'Cliente',
      cell: (q) => q.clientName,
    },
    {
      id: 'status',
      header: 'Estado',
      cell: (q) => (
        <Chip
          size="small"
          label={q.status}
          color={q.status === 'pendiente' ? 'warning' : 'success'}
        />
      ),
    },
    {
      id: 'items',
      header: 'Productos',
      cell: (q) => q.items?.length ?? 0,
    },
    {
      id: 'updated',
      header: 'Actualizada',
      cell: (q) => (q.updatedAt ? new Date(q.updatedAt).toLocaleString() : '—'),
    },
  ];

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Cotizaciones
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <AdminDataTable<Quote>
        rows={quotes}
        rowId={(q) => q.id!}
        columns={columns}
        loading={loading}
        getRowSearchText={(q) =>
          [q.quoteNumber, q.clientName, q.clientEmail, q.status, q.notes].filter(Boolean).join(' ')
        }
        searchPlaceholder="Buscar por folio, cliente, estado…"
        bulkActions={[
          {
            key: 'enviada',
            label: 'Marcar como enviada',
            color: 'primary',
            filterRows: (q) => q.status === 'pendiente',
            onExecute: bulkMarkEnviada,
          },
        ]}
        renderActions={(q) => (
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              const items = normalizeQuoteItemsForEdit(q.items || []);
              const st = items.reduce((s, it) => s + it.subtotal, 0);
              const tx = Number(q.tax ?? 0);
              const iva = !(st > 0 && tx === 0);
              setIncludeIva(iva);
              includeIvaRef.current = iva;
              const { subtotal, tax, total } = recalcTotals(items, iva);
              setEditingQuote({ ...q, items, subtotal, tax, total });
            }}
          >
            Abrir
          </Button>
        )}
        emptyMessage="Sin cotizaciones por ahora"
        defaultRowsPerPage={10}
      />

      <Dialog open={Boolean(editingQuote)} onClose={() => setEditingQuote(null)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
          Cotización {editingQuote?.quoteNumber}
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: '#f5f5f5' }}>
          {editingQuote ? (
            <>
              <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel id="fee-margin-label">Margen / fee sobre lista</InputLabel>
                  <Select
                    labelId="fee-margin-label"
                    label="Margen / fee sobre lista"
                    value={feeMarginPct}
                    onChange={(e) => handleFeeMarginChange(Number(e.target.value))}
                  >
                    {FEE_MARGIN_OPTIONS.map((n) => (
                      <MenuItem key={n} value={n}>
                        {n}%
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setCatalogDialogOpen(true)}>
                  Agregar del catálogo
                </Button>
                <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={addManualLine}>
                  Agregar concepto manual
                </Button>
              </Box>

              <CotizacionFormalDocument quote={editingQuote} showPrices taxAmount={Number(editingQuote.tax || 0)}>
                {editingQuote.items?.map((item, index) => (
                  <TableRow key={item.id ?? `row-${index}`}>
                    <TableCell align="center" sx={docTableCellSx}>
                      <TextField
                        type="number"
                        size="small"
                        inputProps={{ min: 0, step: 1, style: { textAlign: 'center' } }}
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                        sx={{ width: 80 }}
                      />
                    </TableCell>
                    <TableCell sx={docTableCellSx}>
                      {isManualLine(item) ? (
                        <TextField
                          label="Código"
                          size="small"
                          fullWidth
                          value={item.manualCode ?? ''}
                          onChange={(e) => updateManualFields(index, { manualCode: e.target.value })}
                          sx={{ mb: 1 }}
                        />
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              flexShrink: 0,
                              borderRadius: 0.5,
                              bgcolor: 'grey.100',
                              overflow: 'hidden',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {productImageForItem(item) ? (
                              <Box
                                component="img"
                                src={productImageForItem(item)}
                                alt=""
                                sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
                              />
                            ) : (
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', px: 0.5 }}>
                                {item.product?.code || '—'}
                              </Typography>
                            )}
                          </Box>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            {item.product?.code || '—'}
                          </Typography>
                        </Box>
                      )}
                    </TableCell>
                    <TableCell sx={docTableCellSx}>
                      {isManualLine(item) ? (
                        <TextField
                          label="Concepto"
                          size="small"
                          fullWidth
                          required
                          value={item.manualName ?? ''}
                          onChange={(e) => updateManualFields(index, { manualName: e.target.value })}
                          sx={{ mb: 1 }}
                        />
                      ) : (
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {item.product?.name}
                        </Typography>
                      )}
                      {!isManualLine(item) && item.product?.description ? (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {item.product.description}
                        </Typography>
                      ) : null}
                      <TextField
                        label="Notas línea"
                        size="small"
                        fullWidth
                        sx={{ mt: 1 }}
                        value={item.notes || ''}
                        onChange={(e) => updateItem(index, 'notes', e.target.value)}
                      />
                    </TableCell>
                    <TableCell align="center" sx={docTableCellSx}>
                      {isManualLine(item) ? (
                        <TextField
                          label="Unidad"
                          size="small"
                          value={item.manualCategory ?? ''}
                          onChange={(e) => updateManualFields(index, { manualCategory: e.target.value })}
                          sx={{ width: 120 }}
                        />
                      ) : (
                        <Typography variant="body2">{itemUnidad(item)}</Typography>
                      )}
                    </TableCell>
                    <TableCell align="right" sx={docTableCellSx}>
                      <TextField
                        type="number"
                        size="small"
                        inputProps={{ min: 0, step: 0.01, style: { textAlign: 'right' } }}
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, 'unitPrice', Number(e.target.value) || 0)}
                        sx={{ width: 100 }}
                      />
                      {!isManualLine(item) && item.productId != null ? (
                        <Button size="small" onClick={() => resetCatalogPrice(index)} sx={{ mt: 0.5, display: 'block' }}>
                          Precio catálogo
                        </Button>
                      ) : null}
                    </TableCell>
                    <TableCell align="right" sx={{ ...docTableCellSx, fontWeight: 600, verticalAlign: 'top' }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                        {formatMoney(item.subtotal)}
                        <IconButton size="small" color="error" aria-label="Eliminar línea" onClick={() => removeItem(index)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </CotizacionFormalDocument>
            </>
          ) : null}

          {editingQuote ? (
            <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-end' }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={includeIva}
                    onChange={(_, c) => setIncludeIvaAndRecalc(c)}
                  />
                }
                label="Incluir IVA (16% sobre subtotal)"
              />
              <TextField
                label="IVA ($)"
                type="number"
                size="small"
                value={editingQuote.tax ?? 0}
                InputProps={{ readOnly: true }}
                helperText={includeIva ? '16% del subtotal' : 'Sin IVA'}
                sx={{ width: 160 }}
              />
              {!includeIva ? (
                <Typography variant="caption" color="text.secondary">
                  Sin IVA: el total coincide con el subtotal.
                </Typography>
              ) : null}
              <TextField
                label="Notas generales (comentarios en documento)"
                size="small"
                fullWidth
                sx={{ flex: '1 1 100%' }}
                multiline
                minRows={2}
                value={editingQuote.notes || ''}
                onChange={(e) => setEditingQuote((prev) => (prev ? { ...prev, notes: e.target.value } : prev))}
              />
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setEditingQuote(null)}>Cerrar</Button>
          <Button variant="contained" onClick={respondQuote} disabled={saving}>
            {saving ? 'Guardando…' : 'Responder y marcar enviada'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={catalogDialogOpen} onClose={() => setCatalogDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Agregar producto del catálogo</DialogTitle>
        <DialogContent>
          <Autocomplete
            options={products}
            getOptionLabel={(p) => `${p.code} — ${p.name}`}
            renderInput={(params) => <TextField {...params} label="Buscar producto" margin="normal" fullWidth autoFocus />}
            onChange={(_, value) => {
              if (value) addProductLine(value);
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCatalogDialogOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

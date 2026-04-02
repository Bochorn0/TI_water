import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TableCell,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { productService } from 'src/services/product.service';
import { quoteService } from 'src/services/quote.service';
import type { Product } from 'src/types/product.types';
import type { Quote, QuoteItem, QuoteStatus } from 'src/types/quote.types';
import { AdminDataTable, type AdminColumnDef } from 'src/components/admin/AdminDataTable';
import { CotizacionFormalDocument, formatMoney } from 'src/components/cotizacion/CotizacionFormalDocument';
import { docTableCellSx } from 'src/components/cotizacion/cotizacion-formal-styles';
import { COTIZACION_UNIDAD_DEFAULT } from 'src/constants/cotizacion-document';

function itemUnidad(item: QuoteItem) {
  const c = item.product?.category?.trim();
  return c && c.length > 0 ? c.toUpperCase() : COTIZACION_UNIDAD_DEFAULT;
}

export function TiwaterQuotesAdminPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);

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
    item.product?.images?.[0] || catalogFirstImageByProductId.get(item.productId);

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

  const updateItem = (
    index: number,
    field: 'quantity' | 'unitPrice' | 'discount' | 'notes',
    value: number | string,
  ) => {
    if (!editingQuote?.items) return;
    const items = [...editingQuote.items];
    const item = { ...items[index] };
    if (field === 'notes') item.notes = String(value);
    if (field === 'quantity') item.quantity = Number(value);
    if (field === 'unitPrice') item.unitPrice = Number(value);
    if (field === 'discount') item.discount = Number(value);
    item.subtotal = item.quantity * item.unitPrice - (item.discount || 0);
    items[index] = item;
    const subtotal = items.reduce((s, it) => s + it.subtotal, 0);
    const tax = Number(editingQuote.tax || 0);
    setEditingQuote({ ...editingQuote, items, subtotal, total: subtotal + tax });
  };

  const autofillPrice = (index: number) => {
    if (!editingQuote?.items) return;
    const item = editingQuote.items[index];
    const catalogPrice = catalogPriceByProduct.get(item.productId) || 0;
    updateItem(index, 'unitPrice', catalogPrice);
  };

  const setTaxFromPercent = () => {
    if (!editingQuote?.items) return;
    const subtotal = editingQuote.items.reduce((s, it) => s + it.subtotal, 0);
    const tax = Math.round(subtotal * 0.16 * 100) / 100;
    setEditingQuote({ ...editingQuote, tax, subtotal, total: subtotal + tax });
  };

  const respondQuote = async () => {
    if (!editingQuote?.id || !editingQuote.items) return;
    setSaving(true);
    setError(null);
    try {
      const subtotal = editingQuote.items.reduce((sum, item) => sum + item.subtotal, 0);
      const tax = Number(editingQuote.tax || 0);
      await quoteService.update(editingQuote.id, {
        items: editingQuote.items,
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
          <Button size="small" variant="outlined" onClick={() => setEditingQuote(q)}>
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
            <CotizacionFormalDocument quote={editingQuote} showPrices taxAmount={Number(editingQuote.tax || 0)}>
              {editingQuote.items?.map((item, index) => (
                <TableRow key={item.id || index}>
                  <TableCell align="center" sx={docTableCellSx}>
                    <TextField
                      type="number"
                      size="small"
                      inputProps={{ min: 0, step: 0.01, style: { textAlign: 'center' } }}
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', Number(e.target.value) || 0)}
                      sx={{ width: 80 }}
                    />
                  </TableCell>
                  <TableCell sx={docTableCellSx}>
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
                  </TableCell>
                  <TableCell sx={docTableCellSx}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {item.product?.name}
                    </Typography>
                    {item.product?.description ? (
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
                    <Typography variant="body2">{itemUnidad(item)}</Typography>
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
                    <Button size="small" onClick={() => autofillPrice(index)} sx={{ mt: 0.5, display: 'block' }}>
                      Catálogo
                    </Button>
                  </TableCell>
                  <TableCell align="right" sx={{ ...docTableCellSx, fontWeight: 600 }}>
                    {formatMoney(item.subtotal)}
                  </TableCell>
                </TableRow>
              ))}
            </CotizacionFormalDocument>
          ) : null}

          {editingQuote ? (
            <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-end' }}>
              <TextField
                label="IVA ($)"
                type="number"
                size="small"
                value={editingQuote.tax ?? 0}
                onChange={(e) => {
                  const tax = Number(e.target.value) || 0;
                  const subtotal =
                    editingQuote.items?.reduce((s, it) => s + it.subtotal, 0) ?? 0;
                  setEditingQuote({ ...editingQuote, tax, subtotal, total: subtotal + tax });
                }}
                inputProps={{ min: 0, step: 0.01 }}
                sx={{ width: 140 }}
              />
              <Button variant="outlined" size="small" onClick={setTaxFromPercent}>
                IVA 16% del subtotal
              </Button>
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
    </Box>
  );
}

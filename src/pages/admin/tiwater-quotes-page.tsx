import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { productService } from 'src/services/product.service';
import { quoteService } from 'src/services/quote.service';
import type { Product } from 'src/types/product.types';
import type { Quote, QuoteStatus } from 'src/types/quote.types';

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

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const response = await quoteService.getAll({ limit: 300, offset: 0 });
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
      // Keep management usable even when catalog lookup fails.
    }
  };

  const updateItem = (index: number, field: 'quantity' | 'unitPrice' | 'discount' | 'notes', value: number | string) => {
    if (!editingQuote?.items) return;
    const items = [...editingQuote.items];
    const item = { ...items[index] };
    if (field === 'notes') item.notes = String(value);
    if (field === 'quantity') item.quantity = Number(value);
    if (field === 'unitPrice') item.unitPrice = Number(value);
    if (field === 'discount') item.discount = Number(value);
    item.subtotal = item.quantity * item.unitPrice - (item.discount || 0);
    items[index] = item;
    setEditingQuote({ ...editingQuote, items });
  };

  const autofillPrice = (index: number) => {
    if (!editingQuote?.items) return;
    const item = editingQuote.items[index];
    const catalogPrice = catalogPriceByProduct.get(item.productId) || 0;
    updateItem(index, 'unitPrice', catalogPrice);
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
      <Paper>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Folio</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Productos</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {quotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell>{quote.quoteNumber}</TableCell>
                    <TableCell>{quote.clientName}</TableCell>
                    <TableCell>
                      <Chip size="small" label={quote.status} color={quote.status === 'pendiente' ? 'warning' : 'success'} />
                    </TableCell>
                    <TableCell>{quote.items?.length || 0}</TableCell>
                    <TableCell align="right">
                      <Button size="small" variant="outlined" onClick={() => setEditingQuote(quote)}>
                        Abrir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {quotes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      Sin cotizaciones por ahora
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={Boolean(editingQuote)} onClose={() => setEditingQuote(null)} maxWidth="lg" fullWidth>
        <DialogTitle>Responder cotización {editingQuote?.quoteNumber}</DialogTitle>
        <DialogContent dividers>
          {editingQuote?.items?.map((item, index) => (
            <Paper key={item.id || index} sx={{ p: 2, mb: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2">{item.product?.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.product?.code}
                  </Typography>
                </Grid>
                <Grid item xs={6} md={2}>
                  <TextField
                    label="Cant."
                    type="number"
                    size="small"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', Number(e.target.value) || 1)}
                  />
                </Grid>
                <Grid item xs={6} md={2}>
                  <TextField
                    label="Precio"
                    type="number"
                    size="small"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(index, 'unitPrice', Number(e.target.value) || 0)}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button fullWidth variant="outlined" onClick={() => autofillPrice(index)}>
                    Autollenar
                  </Button>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Typography align="right">${item.subtotal.toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Notas del vendedor"
                    value={item.notes || ''}
                    onChange={(e) => updateItem(index, 'notes', e.target.value)}
                  />
                </Grid>
              </Grid>
            </Paper>
          ))}
          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Notas generales"
            value={editingQuote?.notes || ''}
            onChange={(e) => setEditingQuote((prev) => (prev ? { ...prev, notes: e.target.value } : prev))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingQuote(null)}>Cerrar</Button>
          <Button variant="contained" onClick={respondQuote} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : 'Responder y marcar enviada'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

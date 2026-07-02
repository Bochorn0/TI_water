import { Helmet } from 'react-helmet-async';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useAuth } from 'src/auth/auth-context';
import { canManageTiwaterQuotes } from 'src/auth/permissions';
import { useQuoteDraft } from 'src/quote/quote-draft-context';
import { Header } from 'src/components/header';
import { Footer } from 'src/components/footer';
import { productService } from 'src/services/product.service';
import { quoteService } from 'src/services/quote.service';
import type { Product } from 'src/types/product.types';
import type { Quote, QuoteStatus } from 'src/types/quote.types';

function catalogLineQuantity(value: unknown): number {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n < 1) return 1;
  return n;
}

export function CotizacionesPage() {
  const { isAuthenticated, user } = useAuth();
  const isQuoteManager = canManageTiwaterQuotes(user);
  const {
    items: quoteItems,
    addProduct: handleAddProduct,
    removeItem: handleRemoveItem,
    updateItem: handleUpdateItem,
    clear: clearQuoteDraft,
  } = useQuoteDraft();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'crear' | 'mis-cotizaciones' | 'gestionar'>('crear');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [myQuotes, setMyQuotes] = useState<Quote[]>([]);
  const [allQuotes, setAllQuotes] = useState<Quote[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [savingQuote, setSavingQuote] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void fetchProducts();
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedCategory]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (tab === 'mis-cotizaciones') {
      void fetchMyQuotes();
    }
    if (tab === 'gestionar' && isQuoteManager) {
      void fetchAllQuotes();
    }
  }, [isAuthenticated, tab, isQuoteManager]);

  const catalogPriceByProduct = useMemo(() => {
    const map = new Map<number, number>();
    products.forEach((product) => {
      map.set(product.id, Number(product.price || 0));
    });
    return map;
  }, [products]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const filters = {
        isActive: true,
        ...(searchTerm && { search: searchTerm }),
        ...(selectedCategory && { category: selectedCategory }),
        limit: 100,
      };
      const response = await productService.getAll(filters);
      setProducts(response.products);
    } catch (err: any) {
      setError(err.message || 'Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyQuotes = async () => {
    setLoadingQuotes(true);
    try {
      const response = await quoteService.getAll({ limit: 200, offset: 0 });
      setMyQuotes(response.quotes || []);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al cargar cotizaciones');
    } finally {
      setLoadingQuotes(false);
    }
  };

  const fetchAllQuotes = async () => {
    setLoadingQuotes(true);
    try {
      const response = await quoteService.getAll({ limit: 300, offset: 0 });
      setAllQuotes(response.quotes || []);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al cargar cotizaciones');
    } finally {
      setLoadingQuotes(false);
    }
  };

  const handleSubmitQuote = async () => {
    if (!clientName.trim()) {
      setError('El nombre del cliente es requerido');
      return;
    }

    if (quoteItems.length === 0) {
      setError('Debe agregar al menos un producto a la cotización');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const quote: Quote = {
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim() || undefined,
        clientPhone: clientPhone.trim() || undefined,
        clientAddress: clientAddress.trim() || undefined,
        items: quoteItems,
        subtotal: 0,
        tax: 0,
        total: 0,
        notes: notes.trim() || undefined,
        status: 'pendiente',
      };

      await quoteService.create(quote);
      setSubmitSuccess(true);
      clearQuoteDraft();
      setClientName('');
      setClientEmail('');
      setClientPhone('');
      setClientAddress('');
      setNotes('');

      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al crear la cotización');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAutofillCatalogPrice = (itemIndex: number) => {
    if (!editingQuote?.items) return;
    const item = editingQuote.items[itemIndex];
    const catalogPrice =
      item.productId != null ? catalogPriceByProduct.get(item.productId) || 0 : 0;
    const nextItems = [...editingQuote.items];
    nextItems[itemIndex] = {
      ...item,
      unitPrice: catalogPrice,
      subtotal: item.quantity * catalogPrice - (item.discount || 0),
    };
    setEditingQuote({ ...editingQuote, items: nextItems });
  };

  const handleUpdateManagedItem = (
    itemIndex: number,
    field: 'quantity' | 'unitPrice' | 'discount' | 'notes',
    value: number | string
  ) => {
    if (!editingQuote?.items) return;
    const nextItems = [...editingQuote.items];
    const target = { ...nextItems[itemIndex] };
    if (field === 'notes') target.notes = String(value);
    if (field === 'quantity') target.quantity = catalogLineQuantity(value);
    if (field === 'unitPrice') target.unitPrice = Number(value);
    if (field === 'discount') target.discount = Number(value);
    target.subtotal = target.quantity * target.unitPrice - (target.discount || 0);
    nextItems[itemIndex] = target;
    setEditingQuote({ ...editingQuote, items: nextItems });
  };

  const handleRespondQuote = async () => {
    if (!editingQuote?.id || !editingQuote.items) return;
    setSavingQuote(true);
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
      await fetchAllQuotes();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al responder cotización');
    } finally {
      setSavingQuote(false);
    }
  };

  const categories = ['general', 'presurizadores', 'valvulas_sistemas', 'sumergibles', 'plomeria'];

  return (
    <>
      <Helmet>
        <title>Cotizaciones - TI Water</title>
      </Helmet>

      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <Box component="main" sx={{ flex: 1, mt: '100px', py: 4 }}>
          <Container maxWidth="xl">
            <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
              Cotizaciones
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {submitSuccess && (
              <Alert severity="success" sx={{ mb: 3 }}>
                Cotización creada y enviada como pendiente.
              </Alert>
            )}

            <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 3 }}>
              <Tab label="Crear cotización" value="crear" />
              {isAuthenticated && <Tab label="Mis cotizaciones" value="mis-cotizaciones" />}
              {isAuthenticated && isQuoteManager && <Tab label="Gestionar cotizaciones" value="gestionar" />}
            </Tabs>

            {tab === 'crear' && (
              <Grid container spacing={4}>
              {/* Left Column - Products Catalog */}
              <Grid item xs={12} md={8}>
                <Paper sx={{ p: 3, mb: 3 }}>
                  <TextField
                    fullWidth
                    label="Buscar productos"
                    variant="outlined"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                    sx={{ mb: 3 }}
                  />

                  <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
                    <Chip
                      label="Todos"
                      onClick={() => setSelectedCategory('')}
                      color={selectedCategory === '' ? 'primary' : 'default'}
                      sx={{ cursor: 'pointer' }}
                    />
                    {categories.map((cat) => (
                      <Chip
                        key={cat}
                        label={cat.charAt(0).toUpperCase() + cat.slice(1).replace('_', ' ')}
                        onClick={() => setSelectedCategory(cat)}
                        color={selectedCategory === cat ? 'primary' : 'default'}
                        sx={{ cursor: 'pointer' }}
                      />
                    ))}
                  </Box>

                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <Grid container spacing={3}>
                      {products.map((product) => (
                        <Grid item xs={12} sm={6} md={4} key={product.id}>
                          <Card 
                            sx={{ 
                              height: '100%',
                              display: 'flex',
                              flexDirection: 'column',
                              borderRadius: 3,
                              boxShadow: 2,
                              transition: 'transform 0.2s, box-shadow 0.2s',
                              '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: 4,
                              },
                            }}
                          >
                            {/* Image placeholder - could be replaced with actual product image */}
                            <Box
                              sx={{
                                width: '100%',
                                height: 200,
                                bgcolor: 'grey.100',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative',
                                background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                              }}
                            >
                              {product.images && product.images.length > 0 ? (
                                <CardMedia
                                  component="img"
                                  image={product.images[0]}
                                  alt={product.name}
                                  sx={{ height: '100%', objectFit: 'contain' }}
                                />
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  {product.code}
                                </Typography>
                              )}
                              {product.pageNumber && (
                                <Chip
                                  label={`Pág. ${product.pageNumber}`}
                                  size="small"
                                  sx={{
                                    position: 'absolute',
                                    top: 8,
                                    right: 8,
                                    bgcolor: 'primary.main',
                                    color: 'white',
                                    fontWeight: 'bold',
                                  }}
                                />
                              )}
                            </Box>
                            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                              <Typography 
                                variant="h6" 
                                component="h3" 
                                gutterBottom
                                sx={{ 
                                  fontWeight: 600,
                                  color: 'text.primary',
                                  mb: 1,
                                }}
                              >
                                {product.name}
                              </Typography>
                              <Typography 
                                variant="body2" 
                                color="text.secondary" 
                                gutterBottom
                                sx={{ mb: 1 }}
                              >
                                Código: {product.code}
                              </Typography>
                              {product.description && (
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    mb: 2,
                                    color: 'text.secondary',
                                    flexGrow: 1,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                  }}
                                >
                                  {product.description}
                                </Typography>
                              )}
                              <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<InfoIcon />}
                                  onClick={() => {
                                    setSelectedProduct(product);
                                    setProductModalOpen(true);
                                  }}
                                  sx={{ flex: 1 }}
                                >
                                  Detalles
                                </Button>
                                <Button
                                  size="small"
                                  variant="contained"
                                  startIcon={<AddIcon />}
                                  onClick={() => handleAddProduct(product)}
                                  sx={{ flex: 1 }}
                                >
                                  Agregar
                                </Button>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                      {products.length === 0 && !loading && (
                        <Grid item xs={12}>
                          <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
                            No se encontraron productos
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  )}
                </Paper>
              </Grid>

              {/* Right Column - Quote Form */}
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3, position: 'sticky', top: 100 }}>
                  <Typography variant="h6" gutterBottom>
                    Información del Cliente
                  </Typography>
                  <TextField
                    fullWidth
                    label="Nombre del Cliente *"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    sx={{ mb: 2 }}
                    required
                  />
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Teléfono"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Dirección"
                    multiline
                    rows={2}
                    value={clientAddress}
                    onChange={(e) => setClientAddress(e.target.value)}
                    sx={{ mb: 3 }}
                  />

                  <Divider sx={{ my: 3 }} />

                  <Typography variant="h6" gutterBottom>
                    Items de la Cotización
                  </Typography>

                  {quoteItems.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      No hay productos agregados. Busca y agrega productos del catálogo.
                    </Typography>
                  ) : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Producto</TableCell>
                            <TableCell align="right">Cant.</TableCell>
                            <TableCell>Descripción / requerimiento</TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {quoteItems.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <Typography variant="body2">{item.product?.name}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {item.product?.code}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <TextField
                                  type="number"
                                  size="small"
                                  value={item.quantity}
                                  onChange={(e) => handleUpdateItem(index, 'quantity', e.target.value)}
                                  sx={{ width: 70 }}
                                  inputProps={{ min: 1, step: 1 }}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  size="small"
                                  value={item.notes || ''}
                                  onChange={(e) =>
                                    handleUpdateItem(index, 'notes', e.target.value)
                                  }
                                  fullWidth
                                  placeholder="Describe necesidades para este producto"
                                />
                              </TableCell>
                              <TableCell>
                                <IconButton
                                  size="small"
                                  onClick={() => handleRemoveItem(index)}
                                  color="error"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}

                  <Divider sx={{ my: 3 }} />

                  <TextField
                    fullWidth
                    label="Notas adicionales"
                    multiline
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    sx={{ mb: 3 }}
                  />

                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    onClick={handleSubmitQuote}
                    disabled={submitting || quoteItems.length === 0 || !clientName.trim()}
                  >
                    {submitting ? <CircularProgress size={24} /> : 'Enviar cotización'}
                  </Button>
                </Paper>
              </Grid>
            </Grid>
            )}

            {tab === 'mis-cotizaciones' && isAuthenticated && (
              <Paper sx={{ p: 2 }}>
                {loadingQuotes ? (
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
                          <TableCell>Status</TableCell>
                          <TableCell>Productos</TableCell>
                          <TableCell>Actualizada</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {myQuotes.map((quote) => (
                          <TableRow key={quote.id}>
                            <TableCell>{quote.quoteNumber}</TableCell>
                            <TableCell>{quote.clientName}</TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={quote.status}
                                color={quote.status === 'pendiente' ? 'warning' : 'success'}
                              />
                            </TableCell>
                            <TableCell>{quote.items?.length || 0}</TableCell>
                            <TableCell>{quote.updatedAt ? new Date(quote.updatedAt).toLocaleString() : '—'}</TableCell>
                          </TableRow>
                        ))}
                        {myQuotes.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} align="center">
                              No tienes cotizaciones aún
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Paper>
            )}

            {tab === 'gestionar' && isAuthenticated && isQuoteManager && (
              <Paper sx={{ p: 2 }}>
                {loadingQuotes ? (
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
                          <TableCell>Status</TableCell>
                          <TableCell>Productos</TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {allQuotes.map((quote) => (
                          <TableRow key={quote.id}>
                            <TableCell>{quote.quoteNumber}</TableCell>
                            <TableCell>{quote.clientName}</TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={quote.status}
                                color={quote.status === 'pendiente' ? 'warning' : 'success'}
                              />
                            </TableCell>
                            <TableCell>{quote.items?.length || 0}</TableCell>
                            <TableCell align="right">
                              <Button variant="outlined" onClick={() => setEditingQuote(quote)}>
                                Abrir
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {allQuotes.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} align="center">
                              No hay cotizaciones para gestionar
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Paper>
            )}
          </Container>
        </Box>
        <Footer />

        {/* Product Details Modal */}
        <Dialog
          open={productModalOpen}
          onClose={() => setProductModalOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" component="div">
              {selectedProduct?.name}
            </Typography>
            <IconButton onClick={() => setProductModalOpen(false)}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            {selectedProduct && (
              <Grid container spacing={3}>
                {/* Product Image */}
                <Grid item xs={12} md={4}>
                  <Box
                    sx={{
                      width: '100%',
                      height: 300,
                      bgcolor: 'grey.100',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                    }}
                  >
                    {selectedProduct.images && selectedProduct.images.length > 0 ? (
                      <CardMedia
                        component="img"
                        image={selectedProduct.images[0]}
                        alt={selectedProduct.name}
                        sx={{ maxHeight: '100%', objectFit: 'contain' }}
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        {selectedProduct.code}
                      </Typography>
                    )}
                  </Box>
                </Grid>

                {/* Product Information */}
                <Grid item xs={12} md={8}>
                  <Typography variant="h6" gutterBottom>
                    Información General
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText 
                        primary="Código" 
                        secondary={selectedProduct.code}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Categoría" 
                        secondary={selectedProduct.category?.replace('_', ' ').toUpperCase()}
                      />
                    </ListItem>
                    {selectedProduct.catalogSource && (
                      <ListItem>
                        <ListItemText 
                          primary="Catálogo" 
                          secondary={selectedProduct.catalogSource}
                        />
                      </ListItem>
                    )}
                    {selectedProduct.pageNumber && (
                      <ListItem>
                        <ListItemText 
                          primary="Página" 
                          secondary={selectedProduct.pageNumber}
                        />
                      </ListItem>
                    )}
                  </List>

                  {selectedProduct.description && (
                    <>
                      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                        Descripción
                      </Typography>
                      <Typography variant="body1" color="text.secondary" paragraph>
                        {selectedProduct.description}
                      </Typography>
                    </>
                  )}

                  {selectedProduct.specifications && Object.keys(selectedProduct.specifications).length > 0 && (
                    <>
                      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                        Especificaciones Técnicas
                      </Typography>
                      <List>
                        {Object.entries(selectedProduct.specifications).map(([key, value]) => (
                          <ListItem key={key}>
                            <ListItemText 
                              primary={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} 
                              secondary={typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </>
                  )}
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setProductModalOpen(false)}>
              Cerrar
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                if (selectedProduct) {
                  handleAddProduct(selectedProduct);
                  setProductModalOpen(false);
                }
              }}
            >
              Agregar a Cotización
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={Boolean(editingQuote)} onClose={() => setEditingQuote(null)} maxWidth="lg" fullWidth>
          <DialogTitle>Responder cotización {editingQuote?.quoteNumber}</DialogTitle>
          <DialogContent dividers>
            {editingQuote?.items?.map((item, idx) => (
              <Paper key={item.id || idx} sx={{ p: 2, mb: 2 }}>
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
                      inputProps={{ min: 1, step: 1 }}
                      onChange={(e) => handleUpdateManagedItem(idx, 'quantity', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={6} md={2}>
                    <TextField
                      label="Precio"
                      type="number"
                      size="small"
                      value={item.unitPrice}
                      onChange={(e) => handleUpdateManagedItem(idx, 'unitPrice', Number(e.target.value) || 0)}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Button fullWidth onClick={() => handleAutofillCatalogPrice(idx)} variant="outlined">
                      Autollenar catálogo
                    </Button>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Typography align="right" variant="subtitle2">
                      ${item.subtotal.toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Notas del vendedor"
                      size="small"
                      fullWidth
                      value={item.notes || ''}
                      onChange={(e) => handleUpdateManagedItem(idx, 'notes', e.target.value)}
                    />
                  </Grid>
                </Grid>
              </Paper>
            ))}
            <TextField
              fullWidth
              label="Notas generales de respuesta"
              multiline
              minRows={3}
              value={editingQuote?.notes || ''}
              onChange={(e) => setEditingQuote((prev) => (prev ? { ...prev, notes: e.target.value } : prev))}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditingQuote(null)}>Cerrar</Button>
            <Button variant="contained" onClick={handleRespondQuote} disabled={savingQuote}>
              {savingQuote ? <CircularProgress size={20} /> : 'Responder y marcar enviada'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </>
  );
}

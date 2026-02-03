import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  TextField,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon, 
  Search as SearchIcon,
  Info as InfoIcon,
  Close as CloseIcon 
} from '@mui/icons-material';
import { Header } from 'src/components/header';
import { Footer } from 'src/components/footer';
import { productService } from 'src/services/product.service';
import { quoteService } from 'src/services/quote.service';
import type { Product } from 'src/types/product.types';
import type { Quote, QuoteItem } from 'src/types/quote.types';

export function CotizacionesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productModalOpen, setProductModalOpen] = useState(false);

  // Quote state
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [tax, setTax] = useState(0);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Load products on mount and when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchProducts();
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedCategory]);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
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
      console.error('Error fetching products:', err);
      setError(err.message || 'Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = (product: Product) => {
    const existingItemIndex = quoteItems.findIndex((item) => item.productId === product.id);
    
    if (existingItemIndex >= 0) {
      // Update quantity if product already exists
      const updatedItems = [...quoteItems];
      updatedItems[existingItemIndex].quantity += 1;
      updatedItems[existingItemIndex].subtotal =
        updatedItems[existingItemIndex].quantity * updatedItems[existingItemIndex].unitPrice -
        (updatedItems[existingItemIndex].discount || 0);
      setQuoteItems(updatedItems);
    } else {
      // Add new product
      const newItem: QuoteItem = {
        productId: product.id,
        product: {
          code: product.code,
          name: product.name,
          description: product.description,
          category: product.category,
        },
        quantity: 1,
        unitPrice: product.price || 0, // Price will be set manually in quote form
        discount: 0,
        subtotal: 0, // Will be calculated when user sets price in quote form
      };
      setQuoteItems([...quoteItems, newItem]);
    }
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = quoteItems.filter((_, i) => i !== index);
    setQuoteItems(updatedItems);
  };

  const handleUpdateItem = (index: number, field: 'quantity' | 'unitPrice' | 'discount', value: number) => {
    const updatedItems = [...quoteItems];
    updatedItems[index][field] = value;
    updatedItems[index].subtotal =
      updatedItems[index].quantity * updatedItems[index].unitPrice - (updatedItems[index].discount || 0);
    setQuoteItems(updatedItems);
  };

  const calculateSubtotal = () => {
    return quoteItems.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + tax;
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
        subtotal: calculateSubtotal(),
        tax: tax || 0,
        total: calculateTotal(),
        notes: notes.trim() || undefined,
        status: 'draft',
      };

      const createdQuote = await quoteService.create(quote);
      console.log('Quote created:', createdQuote);
      setSubmitSuccess(true);

      // Reset form
      setQuoteItems([]);
      setClientName('');
      setClientEmail('');
      setClientPhone('');
      setClientAddress('');
      setTax(0);
      setNotes('');

      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (err: any) {
      console.error('Error creating quote:', err);
      setError(err.response?.data?.message || err.message || 'Error al crear la cotización');
    } finally {
      setSubmitting(false);
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
              Crear Cotización
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {submitSuccess && (
              <Alert severity="success" sx={{ mb: 3 }}>
                ¡Cotización creada exitosamente!
              </Alert>
            )}

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
                            <TableCell align="right">Precio</TableCell>
                            <TableCell align="right">Total</TableCell>
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
                                  onChange={(e) =>
                                    handleUpdateItem(index, 'quantity', parseFloat(e.target.value) || 1)
                                  }
                                  sx={{ width: 70 }}
                                  inputProps={{ min: 1 }}
                                />
                              </TableCell>
                              <TableCell align="right">
                                <TextField
                                  type="number"
                                  size="small"
                                  value={item.unitPrice}
                                  onChange={(e) =>
                                    handleUpdateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)
                                  }
                                  sx={{ width: 100 }}
                                />
                              </TableCell>
                              <TableCell align="right">
                                ${item.subtotal.toLocaleString()}
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

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Subtotal: ${calculateSubtotal().toLocaleString()}
                    </Typography>
                    <TextField
                      fullWidth
                      label="Impuestos"
                      type="number"
                      size="small"
                      value={tax}
                      onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                      sx={{ mt: 1 }}
                    />
                    <Typography variant="h6" sx={{ mt: 2 }}>
                      Total: ${calculateTotal().toLocaleString()}
                    </Typography>
                  </Box>

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
                    {submitting ? <CircularProgress size={24} /> : 'Crear Cotización'}
                  </Button>
                </Paper>
              </Grid>
            </Grid>
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
      </Box>
    </>
  );
}

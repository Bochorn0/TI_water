import { useCallback, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import CloseIcon from '@mui/icons-material/Close';
import { Header } from 'src/components/header';
import { Footer } from 'src/components/footer';
import { ContactSection } from 'src/components/contact-section';
import { CatalogTechnicalTable } from 'src/components/catalog/catalog-technical-block';
import { useQuoteDraft } from 'src/quote/quote-draft-context';
import { productService } from 'src/services/product.service';
import type { Product } from 'src/types/product.types';
import type { CatalogProductSpecifications, TechnicalComparisonTable } from 'src/types/catalog-spec.types';
import { getApiErrorMessage } from 'src/utils/api-error';

const CATEGORY_DEFS: { value: string; label: string }[] = [
  { value: 'valvulas_sistemas', label: 'Válvulas y sistemas' },
  { value: 'presurizadores', label: 'Presurizadores' },
  { value: 'plomeria', label: 'Plomería' },
  { value: 'sumergibles', label: 'Sumergibles' },
  { value: 'general', label: 'General' },
];

function parseDescriptionLead(desc: string | undefined): string {
  if (!desc) return '';
  return (desc.split('\n\n')[0] || '').trim();
}

function keySpecs(p: Product): { label: string; value: string }[] {
  const spec = (p.specifications as CatalogProductSpecifications) || {};
  const out: { label: string; value: string }[] = [];
  if (spec.subtitle) out.push({ label: 'Serie / tipo', value: spec.subtitle });
  const h = spec.highlights || [];
  h.slice(0, 3).forEach((line) => {
    const t = String(line).trim();
    if (t) {
      const cut = t.length > 90 ? `${t.slice(0, 87)}…` : t;
      out.push({ label: '—', value: cut });
    }
  });
  if (out.length < 2) {
    const lead = parseDescriptionLead(p.description);
    if (lead) out.push({ label: 'Resumen', value: lead.length > 160 ? `${lead.slice(0, 157)}…` : lead });
  }
  return out.slice(0, 4);
}

type SortKey = 'name' | 'code' | 'productKey';

function sortProducts(list: Product[], key: SortKey): Product[] {
  const a = [...list];
  a.sort((x, y) => {
    if (key === 'code') return String(x.code).localeCompare(String(y.code), 'es', { numeric: true });
    if (key === 'productKey')
      return String(x.productKey || x.code).localeCompare(String(y.productKey || y.code), 'es', { numeric: true });
    return String(x.name).localeCompare(String(y.name), 'es');
  });
  return a;
}

export function PublicCatalogPage() {
  const { addProduct, itemCount, totalUnits } = useQuoteDraft();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<Record<string, boolean>>(
    () => Object.fromEntries(CATEGORY_DEFS.map((c) => [c.value, false])),
  );
  const [sort, setSort] = useState<SortKey>('name');
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [detail, setDetail] = useState<Product | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await productService.getAll({ limit: 500, isActive: true });
      setAllProducts(res.products || []);
    } catch (e) {
      setError(getApiErrorMessage(e, 'No se pudo cargar el catálogo.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const anyCategorySelected = useMemo(
    () => Object.values(categoryFilter).some(Boolean),
    [categoryFilter],
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = allProducts;
    if (anyCategorySelected) {
      const allowed = new Set(
        Object.entries(categoryFilter)
          .filter(([, on]) => on)
          .map(([k]) => k),
      );
      list = list.filter((p) => (p.category ? allowed.has(String(p.category)) : false));
    }
    if (q) {
      list = list.filter((p) => {
        const blob = [p.name, p.code, p.productKey, p.description]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return blob.includes(q);
      });
    }
    return sortProducts(list, sort);
  }, [allProducts, search, categoryFilter, anyCategorySelected, sort]);

  const handleAdd = (p: Product) => {
    addProduct(p);
    toast.success(`«${p.code}» añadido a su cotización`);
  };

  const clearFilters = () => {
    setSearch('');
    setCategoryFilter(Object.fromEntries(CATEGORY_DEFS.map((c) => [c.value, false])));
  };

  return (
    <>
      <Helmet>
        <title>Catálogo de productos - TI Water</title>
        <meta
          name="description"
          content="Elija productos y arme su cotización. Especificaciones técnicas y fichas al estilo catálogo comercial."
        />
      </Helmet>

      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <Box component="main" sx={{ flex: 1, mt: '100px' }}>
          <Box sx={{ py: 3, bgcolor: 'background.default' }}>
            <Container maxWidth="lg">
              <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                <Box>
                  <Typography variant="h3" component="h1" sx={{ fontSize: { xs: '1.5rem', md: '1.9rem' } }}>
                    Catálogo de productos
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    Añada productos a su cotización (como un carrito). Luego en{' '}
                    <Box component="span" fontWeight={600}>
                      Cotizaciones
                    </Box>{' '}
                    indique sus datos y envíe la solicitud.
                  </Typography>
                </Box>
                <Button component={Link} to="/cotizaciones" variant="contained" size="large" sx={{ textTransform: 'none' }}>
                  Ir a mi cotización
                  {totalUnits > 0 ? ` (${totalUnits})` : ''}
                </Button>
              </Box>
            </Container>
          </Box>

          <Container maxWidth="lg" sx={{ py: 2, pb: { xs: 10, sm: 4 } }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <Paper variant="outlined" sx={{ p: 2, position: { md: 'sticky' }, top: 112 }}>
                  <Typography fontWeight={700} sx={{ mb: 1.5 }}>
                    Filtros
                  </Typography>
                  <TextField
                    size="small"
                    fullWidth
                    label="Buscar"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Código, nombre, clave…"
                    sx={{ mb: 2 }}
                  />
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                    Categoría
                  </Typography>
                  <FormGroup>
                    {CATEGORY_DEFS.map((c) => (
                      <FormControlLabel
                        key={c.value}
                        control={
                          <Checkbox
                            size="small"
                            checked={!!categoryFilter[c.value]}
                            onChange={(e) => setCategoryFilter((prev) => ({ ...prev, [c.value]: e.target.checked }))}
                          />
                        }
                        label={<Typography variant="body2">{c.label}</Typography>}
                      />
                    ))}
                  </FormGroup>
                  <Button size="small" onClick={clearFilters} sx={{ mt: 1 }}>
                    Limpiar filtros
                  </Button>
                </Paper>
              </Grid>

              <Grid item xs={12} md={9}>
                <Stack direction="row" flexWrap="wrap" alignItems="center" justifyContent="space-between" gap={2} sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {loading ? 'Cargando…' : `Mostrando ${visible.length} de ${allProducts.length} productos`}
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" alignItems="center" gap={1}>
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                      <InputLabel>Ordenar</InputLabel>
                      <Select
                        value={sort}
                        label="Ordenar"
                        onChange={(e) => setSort(e.target.value as SortKey)}
                      >
                        <MenuItem value="name">Nombre</MenuItem>
                        <MenuItem value="code">Código</MenuItem>
                        <MenuItem value="productKey">Clave de catálogo</MenuItem>
                      </Select>
                    </FormControl>
                    <ToggleButtonGroup
                      size="small"
                      value={view}
                      exclusive
                      onChange={(_, v) => v && setView(v)}
                    >
                      <ToggleButton value="list" aria-label="lista">
                        <ViewListIcon fontSize="small" />
                      </ToggleButton>
                      <ToggleButton value="grid" aria-label="malla">
                        <ViewModuleIcon fontSize="small" />
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Stack>
                </Stack>

                {loading && (
                  <Box display="flex" justifyContent="center" py={6}>
                    <CircularProgress />
                  </Box>
                )}

                {!loading && !error && visible.length === 0 && (
                  <Alert severity="info">Ningún producto coincide. Pruebe otros filtros o búsqueda.</Alert>
                )}

                {!loading && view === 'list' && (
                  <Stack spacing={1.5}>
                    {visible.map((p) => (
                      <ListProductRow
                        key={p.id}
                        product={p}
                        onAdd={() => handleAdd(p)}
                        onDetail={() => setDetail(p)}
                      />
                    ))}
                  </Stack>
                )}

                {!loading && view === 'grid' && (
                  <Grid container spacing={2}>
                    {visible.map((p) => (
                      <Grid item xs={12} sm={6} key={p.id}>
                        <GridProductCard
                          product={p}
                          onAdd={() => handleAdd(p)}
                          onDetail={() => setDetail(p)}
                        />
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Grid>
            </Grid>
          </Container>

          {detail && <ProductDetailDialog product={detail} onClose={() => setDetail(null)} />}

          <Box sx={{ display: { xs: 'block', sm: 'none' } }} />
          <Paper
            elevation={6}
            sx={{
              display: { xs: itemCount > 0 ? 'flex' : 'none', sm: 'none' },
              position: 'fixed',
              left: 0,
              right: 0,
              bottom: 0,
              p: 1.5,
              zIndex: 20,
              alignItems: 'center',
              justifyContent: 'space-between',
              borderRadius: 0,
            }}
          >
            <Typography variant="body2">
              {totalUnits} pzs. en cotización
            </Typography>
            <Button component={Link} to="/cotizaciones" variant="contained" size="small">
              Continuar
            </Button>
          </Paper>
          <ContactSection />
        </Box>
        <Footer />
      </Box>
    </>
  );
}

function ListProductRow({
  product: p,
  onAdd,
  onDetail,
}: {
  product: Product;
  onAdd: () => void;
  onDetail: () => void;
}) {
  const spec = (p.specifications as CatalogProductSpecifications) || {};
  const rows = keySpecs(p);
  const img = p.images && p.images[0];

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '120px 1fr auto' },
        gap: 2,
        alignItems: 'start',
      }}
    >
      <Box
        sx={{
          width: { sm: 120 },
          minHeight: 100,
          bgcolor: 'grey.100',
          borderRadius: 1,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {img ? (
          <Box component="img" src={img} alt={p.name} sx={{ width: '100%', height: 100, objectFit: 'contain' }} />
        ) : (
          <Typography variant="caption" color="text.secondary" px={1}>
            {p.code}
          </Typography>
        )}
      </Box>
      <Box>
        {p.productKey && (
          <Chip size="small" label={p.productKey} sx={{ mr: 0.5, mb: 0.5 }} color="primary" variant="outlined" />
        )}
        <Typography variant="h6" component="h2" sx={{ fontSize: '1.1rem', fontWeight: 700 }}>
          {p.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Código: {p.code}
          {spec.source?.file ? ` · ${spec.source.file}` : ''}
        </Typography>
        <Box component="ul" sx={{ m: 0, pl: 2.5, mb: 0 }}>
          {rows.map((r) => (
            <li key={r.value}>
              <Typography variant="body2" color="text.secondary" component="span">
                {r.label !== '—' && (
                  <Box component="span" fontWeight={600} color="text.primary" sx={{ mr: 0.5 }}>
                    {r.label}:
                  </Box>
                )}
                {r.value}
              </Typography>
            </li>
          ))}
        </Box>
        {p.price != null && p.price > 0 && (
          <Typography variant="body2" sx={{ mt: 0.5 }} fontWeight={600}>
            Lista: ${Number(p.price).toFixed(2)} MXN
          </Typography>
        )}
      </Box>
      <Stack spacing={1} alignItems="stretch" sx={{ minWidth: { sm: 200 } }}>
        <Button
          variant="contained"
          startIcon={<AddShoppingCartIcon />}
          onClick={onAdd}
          size="small"
          sx={{ textTransform: 'none' }}
        >
          Añadir a cotización
        </Button>
        <Button variant="outlined" size="small" onClick={onDetail} sx={{ textTransform: 'none' }}>
          Ficha técnica
        </Button>
      </Stack>
    </Paper>
  );
}

function GridProductCard({
  product: p,
  onAdd,
  onDetail,
}: {
  product: Product;
  onAdd: () => void;
  onDetail: () => void;
}) {
  const img = p.images && p.images[0];
  return (
    <Paper variant="outlined" sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          height: 160,
          bgcolor: 'grey.100',
          borderRadius: 1,
          mb: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {img ? (
          <Box component="img" src={img} alt={p.name} sx={{ maxWidth: '100%', maxHeight: 160, objectFit: 'contain' }} />
        ) : (
          <Typography color="text.secondary" variant="caption">
            {p.code}
          </Typography>
        )}
      </Box>
      <Typography variant="subtitle1" fontWeight={700} sx={{ flex: 1 }}>
        {p.name}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {p.code} {p.productKey ? `· ${p.productKey}` : ''}
      </Typography>
      <Stack direction="row" gap={1} mt="auto" flexWrap="wrap">
        <Button size="small" variant="contained" startIcon={<AddShoppingCartIcon />} onClick={onAdd} sx={{ textTransform: 'none' }}>
          Añadir
        </Button>
        <Button size="small" variant="outlined" onClick={onDetail} sx={{ textTransform: 'none' }}>
          Ficha
        </Button>
      </Stack>
    </Paper>
  );
}

/** API sometimes returns JSONB sub-objects as string (or loose shapes). */
function getTechnicalTable(spec: Product['specifications']): TechnicalComparisonTable | null {
  if (!spec || typeof spec !== 'object') return null;
  const raw = (spec as CatalogProductSpecifications).technicalComparisonTable;
  if (raw == null) return null;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as TechnicalComparisonTable;
    } catch {
      return null;
    }
  }
  return raw as TechnicalComparisonTable;
}

function parseDescriptionBody(desc: string | undefined): { lead: string; rest: string } {
  if (!desc) return { lead: '', rest: '' };
  const parts = desc.split('\n\n');
  return { lead: (parts[0] || '').trim(), rest: parts.slice(1).join('\n\n').trim() };
}

function ProductDetailDialog({ product, onClose }: { product: Product; onClose: () => void }) {
  const spec = (product.specifications as CatalogProductSpecifications) || {};
  const tech = getTechnicalTable(product.specifications);
  const { lead, rest } = parseDescriptionBody(product.description);
  const h = spec.highlights || [];
  return (
    <Dialog open fullWidth maxWidth="xl" onClose={onClose} scroll="paper" aria-labelledby="catalog-tech-dialog-title">
      <DialogTitle id="catalog-tech-dialog-title" sx={{ pr: 6 }}>
        {product.name}
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
          aria-label="cerrar"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack direction={{ xs: 'column', sm: 'row' }} gap={2} alignItems="flex-start">
          {product.images?.[0] && (
            <Box
              component="img"
              src={product.images[0]}
              alt={product.name}
              sx={{ width: { sm: 200 }, maxWidth: '100%', objectFit: 'contain', borderRadius: 1, border: 1, borderColor: 'divider' }}
            />
          )}
          <Box>
            <Stack direction="row" gap={1} flexWrap="wrap" mb={1}>
              {product.productKey && <Chip size="small" label={product.productKey} />}
              <Chip size="small" label={product.code} variant="outlined" />
            </Stack>
            {spec.subtitle && (
              <Typography color="text.secondary" gutterBottom>
                {spec.subtitle}
              </Typography>
            )}
            {spec.source && (
              <Typography variant="caption" color="text.secondary" display="block">
                Fuente: {spec.source.file || '—'}
                {spec.source.pdfPage != null ? ` · pág. ${spec.source.pdfPage}` : ''}
              </Typography>
            )}
            <Typography variant="body1" sx={{ mt: 1, textAlign: 'justify' }}>
              {lead}
            </Typography>
            {h.length > 0 && (
              <Box component="ul" sx={{ pl: 2.5, my: 1 }}>
                {h.map((x) => (
                  <li key={x}>
                    <Typography variant="body2">{x}</Typography>
                  </li>
                ))}
              </Box>
            )}
            {rest && (
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                {rest}
              </Typography>
            )}
          </Box>
        </Stack>
        <Divider sx={{ my: 2 }} />
        {tech?.title && (
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
            {tech.title}
          </Typography>
        )}
        {tech && <CatalogTechnicalTable table={tech} />}
      </DialogContent>
    </Dialog>
  );
}

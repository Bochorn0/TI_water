import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
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
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { CONFIG } from 'src/config-global';
import { get, del } from 'src/api/axiosHelper';
import type { Product, ProductResponse } from 'src/types/product.types';
import { getApiErrorMessage } from 'src/utils/api-error';

const categories = ['general', 'presurizadores', 'valvulas_sistemas', 'sumergibles', 'plomeria'];
const categoryLabels: Record<string, string> = {
  general: 'General',
  presurizadores: 'Presurizadores',
  valvulas_sistemas: 'Válvulas y Sistemas',
  sumergibles: 'Sumergibles',
  plomeria: 'Plomería',
};

export function TiwaterCatalogAdminPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    void fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, categoryFilter]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const filters: Record<string, string | number> = { limit: 100 };
      if (searchTerm) filters.search = searchTerm;
      if (categoryFilter) filters.category = categoryFilter;
      const response = await get<ProductResponse>('/products', filters);
      setProducts(response.products || []);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Error al cargar productos'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Eliminar este producto?')) return;
    try {
      await del(`/products/${id}`);
      toast.success('Producto eliminado');
      void fetchProducts();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Error al eliminar'));
    }
  };

  return (
    <>
      <Helmet>
        <title>Catálogo TI Water — {CONFIG.appName}</title>
      </Helmet>
      <Box sx={{ p: 2, maxWidth: 1200, mx: 'auto' }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Catálogo de productos (admin)
        </Typography>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
            mb: 2,
            alignItems: 'center',
          }}
        >
          <TextField
            size="small"
            placeholder="Buscar…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ minWidth: 200 }}
          />
          <TextField
            select
            size="small"
            label="Categoría"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            SelectProps={{ native: true }}
            sx={{ minWidth: 180 }}
          >
            <option value="">Todas</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {categoryLabels[c]}
              </option>
            ))}
          </TextField>
          <Button variant="contained" onClick={() => navigate('/admin/catalogo/nuevo')}>
            Añadir producto
          </Button>
        </Box>

        <TableContainer component={Paper}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell>Código</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Categoría</TableCell>
                  <TableCell>Precio</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography color="text.secondary">No hay productos</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((p) => (
                    <TableRow key={p.id} hover>
                      <TableCell>{p.code}</TableCell>
                      <TableCell>{p.name}</TableCell>
                      <TableCell>
                        {p.category ? categoryLabels[p.category] || p.category : '—'}
                      </TableCell>
                      <TableCell>
                        {p.price != null ? `$${Number(p.price).toFixed(2)}` : '—'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={p.isActive ? 'Activo' : 'Inactivo'}
                          color={p.isActive ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => navigate(`/admin/catalogo/${p.id}`)}
                          aria-label="editar"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(p.id)}
                          aria-label="eliminar"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </TableContainer>
      </Box>
    </>
  );
}

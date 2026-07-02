import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Box, Button, Chip, IconButton, MenuItem, TextField, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { CONFIG } from 'src/config-global';
import { get, del, patch } from 'src/api/axiosHelper';
import type { Product, ProductResponse } from 'src/types/product.types';
import { getApiErrorMessage } from 'src/utils/api-error';
import { AdminDataTable, type AdminColumnDef } from 'src/components/admin/AdminDataTable';

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
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    void fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const filters: Record<string, string | number> = { limit: 500 };
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

  const columns: AdminColumnDef<Product>[] = [
    {
      id: 'code',
      header: 'Código',
      cell: (p) => p.code,
    },
    {
      id: 'name',
      header: 'Nombre',
      cell: (p) => p.name,
    },
    {
      id: 'category',
      header: 'Categoría',
      cell: (p) => (p.category ? categoryLabels[p.category] || p.category : '—'),
    },
    {
      id: 'price',
      header: 'Precio',
      cell: (p) => (p.price != null ? `$${Number(p.price).toFixed(2)}` : '—'),
    },
    {
      id: 'status',
      header: 'Estado',
      cell: (p) => (
        <Chip
          size="small"
          label={p.isActive ? 'Activo' : 'Inactivo'}
          color={p.isActive ? 'success' : 'default'}
        />
      ),
    },
  ];

  return (
    <>
      <Helmet>
        <title>Catálogo TI Water — {CONFIG.appName}</title>
      </Helmet>
      <Box sx={{ p: 2, maxWidth: 1200, mx: 'auto' }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 2, mb: 1 }}>
          <Typography variant="h5">Catálogo de productos (admin)</Typography>
          <Button variant="contained" onClick={() => navigate('/admin/catalogo/nuevo')}>
            Añadir producto
          </Button>
        </Box>

        <AdminDataTable<Product>
          rows={products}
          rowId={(p) => p.id}
          columns={columns}
          loading={loading}
          getRowSearchText={(p) =>
            [p.code, p.name, p.description, p.category, p.catalogSource, String(p.price ?? '')]
              .filter(Boolean)
              .join(' ')
          }
          searchPlaceholder="Buscar por código, nombre, categoría…"
          toolbarExtras={
            <TextField
              select
              size="small"
              label="Categoría"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              InputLabelProps={{ shrink: true }}
              SelectProps={{ displayEmpty: true }}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="">Todas</MenuItem>
              {categories.map((c) => (
                <MenuItem key={c} value={c}>
                  {categoryLabels[c]}
                </MenuItem>
              ))}
            </TextField>
          }
          bulkActions={[
            {
              key: 'activate',
              label: 'Activar seleccionados',
              color: 'success',
              onExecute: async (rows) => {
                try {
                  await Promise.all(
                    rows.map((p) => patch(`/products/${p.id}`, { isActive: true })),
                  );
                  toast.success(`${rows.length} producto(s) activados`);
                  void fetchProducts();
                } catch (err) {
                  toast.error(getApiErrorMessage(err, 'Error al activar'));
                }
              },
            },
            {
              key: 'deactivate',
              label: 'Desactivar seleccionados',
              color: 'warning',
              variant: 'outlined',
              onExecute: async (rows) => {
                try {
                  await Promise.all(
                    rows.map((p) => patch(`/products/${p.id}`, { isActive: false })),
                  );
                  toast.success(`${rows.length} producto(s) desactivados`);
                  void fetchProducts();
                } catch (err) {
                  toast.error(getApiErrorMessage(err, 'Error al desactivar'));
                }
              },
            },
            {
              key: 'delete',
              label: 'Eliminar seleccionados',
              color: 'error',
              variant: 'outlined',
              onExecute: async (rows) => {
                if (!window.confirm(`¿Eliminar ${rows.length} producto(s)?`)) return;
                try {
                  await Promise.all(rows.map((p) => del(`/products/${p.id}`)));
                  toast.success('Productos eliminados');
                  void fetchProducts();
                } catch (err) {
                  toast.error(getApiErrorMessage(err, 'Error al eliminar'));
                }
              },
            },
          ]}
          renderActions={(p) => (
            <>
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
            </>
          )}
          emptyMessage="No hay productos"
          defaultRowsPerPage={10}
        />
      </Box>
    </>
  );
}

import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  type SelectChangeEvent,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { CONFIG } from 'src/config-global';
import { get, post, patch } from 'src/api/axiosHelper';
import type { Product } from 'src/types/product.types';
import { getApiErrorMessage } from 'src/utils/api-error';

const categories = ['general', 'presurizadores', 'valvulas_sistemas', 'sumergibles', 'plomeria'];
const categoryLabels: Record<string, string> = {
  general: 'General',
  presurizadores: 'Presurizadores',
  valvulas_sistemas: 'Válvulas y Sistemas',
  sumergibles: 'Sumergibles',
  plomeria: 'Plomería',
};

type FormShape = Partial<Product> & { images?: string[] };

const emptyForm: FormShape = {
  code: '',
  name: '',
  description: '',
  category: '',
  price: undefined,
  specifications: {},
  images: [],
  catalogSource: '',
  pageNumber: undefined,
  isActive: true,
};

export function TiwaterCatalogProductAdminPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'nuevo' || id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FormShape>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isNew && id) {
      void fetchProduct(Number(id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isNew]);

  const fetchProduct = async (productId: number) => {
    setLoading(true);
    try {
      const product = await get<Product>(`/products/${productId}`);
      setFormData({
        ...product,
        images: product.images || [],
      });
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Error al cargar producto'));
      navigate('/admin/catalogo');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'price' || name === 'pageNumber') {
      const num = value === '' ? undefined : Number(value);
      setFormData((prev) => ({ ...prev, [name]: Number.isNaN(num as number) ? undefined : num }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleCategory = (e: SelectChangeEvent<string>) => {
    setFormData((prev) => ({ ...prev, category: e.target.value }));
  };

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>, index?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const b64 = reader.result as string;
      setFormData((prev) => {
        const imgs = [...(prev.images || [])];
        if (index !== undefined && index >= 0) imgs[index] = b64;
        else imgs.push(b64);
        return { ...prev, images: imgs };
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== index),
    }));
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!formData.code?.trim()) next.code = 'Requerido';
    if (!formData.name?.trim()) next.name = 'Requerido';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      toast.warning('Completa código y nombre');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...formData,
        price:
          formData.price !== undefined && formData.price !== null
            ? Number(formData.price)
            : undefined,
        pageNumber:
          formData.pageNumber !== undefined && formData.pageNumber !== null
            ? Number(formData.pageNumber)
            : undefined,
        specifications: formData.specifications || {},
        images: formData.images || [],
        isActive: formData.isActive !== false,
      };
      if (isNew) {
        await post<Product>('/products', payload);
        toast.success('Producto creado');
      } else {
        await patch<Product>(`/products/${id}`, payload);
        toast.success('Producto actualizado');
      }
      navigate('/admin/catalogo');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Error al guardar'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Helmet>
        <title>{isNew ? 'Nuevo producto' : 'Editar producto'} — {CONFIG.appName}</title>
      </Helmet>
      <Box sx={{ p: 2, maxWidth: 900, mx: 'auto' }}>
        <Box display="flex" alignItems="center" gap={1} sx={{ mb: 2 }}>
          <IconButton onClick={() => navigate('/admin/catalogo')} aria-label="volver">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5">{isNew ? 'Nuevo producto' : 'Editar producto'}</Typography>
        </Box>

        <Paper sx={{ p: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="code"
                label="Código *"
                value={formData.code || ''}
                onChange={handleChange}
                fullWidth
                error={!!errors.code}
                helperText={errors.code}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="name"
                label="Nombre *"
                value={formData.name || ''}
                onChange={handleChange}
                fullWidth
                error={!!errors.name}
                helperText={errors.name}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Categoría</InputLabel>
                <Select
                  value={formData.category || ''}
                  label="Categoría"
                  onChange={handleCategory}
                >
                  <MenuItem value="">—</MenuItem>
                  {categories.map((c) => (
                    <MenuItem key={c} value={c}>
                      {categoryLabels[c]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="price"
                label="Precio"
                type="number"
                value={formData.price ?? ''}
                onChange={handleChange}
                fullWidth
                inputProps={{ step: '0.01', min: 0 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Descripción"
                value={formData.description || ''}
                onChange={handleChange}
                fullWidth
                multiline
                minRows={3}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="catalogSource"
                label="Fuente catálogo"
                value={formData.catalogSource || ''}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="pageNumber"
                label="Página"
                type="number"
                value={formData.pageNumber ?? ''}
                onChange={handleChange}
                fullWidth
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive !== false}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, isActive: e.target.checked }))
                    }
                  />
                }
                label="Producto activo (visible en cotizaciones)"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Imágenes (base64)
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {(formData.images || []).map((src, i) => (
                  <Box key={i} sx={{ position: 'relative', width: 140 }}>
                    <Box
                      component="img"
                      src={src}
                      alt=""
                      sx={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 1 }}
                    />
                    <Button size="small" onClick={() => removeImage(i)} color="error">
                      Quitar
                    </Button>
                    <Button size="small" component="label">
                      Reemplazar
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) => handleImagePick(e, i)}
                      />
                    </Button>
                  </Box>
                ))}
                <Box>
                  <Button variant="outlined" component="label" size="small">
                    Agregar imagen
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => handleImagePick(e)}
                    />
                  </Button>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box display="flex" gap={2} justifyContent="flex-end" sx={{ mt: 2 }}>
                <Button onClick={() => navigate('/admin/catalogo')} disabled={saving}>
                  Cancelar
                </Button>
                <Button variant="contained" onClick={() => void handleSave()} disabled={saving}>
                  {saving ? <CircularProgress size={22} /> : isNew ? 'Crear' : 'Guardar'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </>
  );
}

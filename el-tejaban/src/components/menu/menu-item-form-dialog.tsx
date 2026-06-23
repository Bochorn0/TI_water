import { useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem as MuiMenuItem,
  Select,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { MenuItemImageField } from './menu-item-image-field';
import type { MenuItem, MenuItemFormData } from '@tejaban/types/menu.types';
import {
  MENU_CATEGORIES,
  MENU_CATEGORY_LABELS,
  menuItemToFormData,
} from '@tejaban/types/menu.types';

type Props = {
  open: boolean;
  item?: MenuItem | null;
  onClose: () => void;
  onSave: (data: MenuItemFormData) => Promise<void>;
};

export function MenuItemFormDialog({ open, item, onClose, onSave }: Props) {
  const isEdit = Boolean(item);
  const [form, setForm] = useState<MenuItemFormData>(() => menuItemToFormData(item));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setForm(menuItemToFormData(item));
      setError('');
    }
  }, [open, item]);

  const update = <K extends keyof MenuItemFormData>(key: K, value: MenuItemFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    setError('');
    if (!form.name.trim()) {
      setError('El nombre es requerido');
      return;
    }
    if (form.price < 0 || Number.isNaN(form.price)) {
      setError('Precio inválido');
      return;
    }
    if (form.itemType === 'combo' && !form.comboIncludes.trim()) {
      setError('Indica qué incluye el paquete');
      return;
    }

    setSubmitting(true);
    try {
      await onSave(form);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 800 }}>
        {isEdit ? 'Editar producto' : 'Nuevo producto'}
      </DialogTitle>

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
        <MenuItemImageField
          value={form.imageUrl}
          onChange={(url) => update('imageUrl', url)}
          productName={form.name}
        />

        <TextField
          label="Nombre"
          fullWidth
          required
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
          placeholder="Ej. Taco de Camarón"
        />

        <FormControl fullWidth>
          <InputLabel>Categoría</InputLabel>
          <Select
            label="Categoría"
            value={form.category}
            onChange={(e) => update('category', e.target.value as MenuItemFormData['category'])}
          >
            {MENU_CATEGORIES.map((cat) => (
              <MuiMenuItem key={cat} value={cat}>
                {MENU_CATEGORY_LABELS[cat]}
              </MuiMenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>Tipo</InputLabel>
          <Select
            label="Tipo"
            value={form.itemType}
            onChange={(e) => update('itemType', e.target.value as MenuItemFormData['itemType'])}
          >
            <MuiMenuItem value="item">Producto</MuiMenuItem>
            <MuiMenuItem value="combo">Paquete</MuiMenuItem>
          </Select>
        </FormControl>

        <TextField
          label="Precio (MXN)"
          type="number"
          fullWidth
          required
          value={form.price || ''}
          onChange={(e) => update('price', parseFloat(e.target.value) || 0)}
          inputProps={{ min: 0, step: 1 }}
        />

        <TextField
          label="Descripción"
          fullWidth
          multiline
          minRows={2}
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
          placeholder="Opcional"
        />

        {form.itemType === 'combo' && (
          <TextField
            label="Incluye (separado por comas)"
            fullWidth
            required
            multiline
            minRows={2}
            value={form.comboIncludes}
            onChange={(e) => update('comboIncludes', e.target.value)}
            placeholder="Ej. Vaso de cahuamanta, Refresco, Taco manta al disco"
          />
        )}

        <FormControlLabel
          control={
            <Switch checked={form.isActive} onChange={(e) => update('isActive', e.target.checked)} />
          }
          label="Activo en menú"
        />

        {error && (
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} size="large" disabled={submitting}>
          Cancelar
        </Button>
        <Button variant="contained" size="large" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Guardando...' : isEdit ? 'Actualizar' : 'Agregar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

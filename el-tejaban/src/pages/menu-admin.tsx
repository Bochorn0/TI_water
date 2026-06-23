import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Fab,
  IconButton,
  Skeleton,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { toast } from 'react-toastify';
import { MenuItemFormDialog } from '@tejaban/components/menu/menu-item-form-dialog';
import { MenuItemImage } from '@tejaban/components/menu/menu-item-image';
import { menuService } from '@tejaban/services/menu.service';
import type { MenuCategory, MenuItem, MenuItemFormData } from '@tejaban/types/menu.types';
import {
  MENU_CATEGORY_LABELS,
  MENU_CATEGORIES,
  formDataToMenuPayload,
} from '@tejaban/types/menu.types';
import { formatCurrency } from '@tejaban/utils/format';

const BOTTOM_NAV_CLEARANCE = 'calc(88px + env(safe-area-inset-bottom, 0px))';

export default function MenuAdminPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<MenuCategory | 'all'>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const load = () => {
    setLoading(true);
    menuService
      .getAllMenuItems()
      .then(setItems)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = useMemo(() => {
    if (categoryFilter === 'all') return items;
    return items.filter((i) => i.category === categoryFilter);
  }, [items, categoryFilter]);

  const openCreate = () => {
    setEditingItem(null);
    setFormOpen(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormOpen(true);
  };

  const handleSave = async (data: MenuItemFormData) => {
    if (editingItem) {
      await menuService.updateMenuItem(editingItem.id, formDataToMenuPayload(data, editingItem.sortOrder));
      toast.success('Producto actualizado');
    } else {
      const maxSort = items.reduce((m, i) => Math.max(m, i.sortOrder), 0);
      await menuService.createMenuItem(formDataToMenuPayload(data, maxSort + 1));
      toast.success('Producto agregado');
    }
    load();
  };

  const handleDelete = async (item: MenuItem) => {
    const confirmed = window.confirm(`¿Eliminar "${item.name}"? Esta acción no se puede deshacer.`);
    if (!confirmed) return;

    try {
      await menuService.deleteMenuItem(item.id);
      toast.success('Producto eliminado');
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al eliminar');
    }
  };

  return (
    <Box sx={{ pb: BOTTOM_NAV_CLEARANCE }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={800} gutterBottom>
            Administrar menú
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Agregar, editar y eliminar productos · Solo administradores
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreate}
          sx={{ display: { xs: 'none', sm: 'flex' }, flexShrink: 0, minHeight: 48 }}
        >
          Nuevo
        </Button>
      </Box>

      <Tabs
        value={categoryFilter}
        onChange={(_, v) => setCategoryFilter(v)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{ mb: 2, minHeight: 48 }}
      >
        <Tab label="Todos" value="all" sx={{ minHeight: 48 }} />
        {MENU_CATEGORIES.map((cat) => (
          <Tab key={cat} label={MENU_CATEGORY_LABELS[cat]} value={cat} sx={{ minHeight: 48 }} />
        ))}
      </Tabs>

      {loading ? (
        [...Array(4)].map((_, i) => <Skeleton key={i} height={100} sx={{ mb: 1.5, borderRadius: 2 }} />)
      ) : filtered.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography color="text.secondary" gutterBottom>
            No hay productos en esta categoría.
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ mt: 1 }}>
            Agregar producto
          </Button>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {filtered.map((item) => (
            <Card
              key={item.id}
              elevation={0}
              sx={{
                border: 1,
                borderColor: 'divider',
                opacity: item.isActive ? 1 : 0.65,
              }}
            >
              <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                  <MenuItemImage
                    src={item.imageUrl}
                    alt={item.name}
                    width={96}
                    height={72}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, alignItems: 'center', mb: 0.5 }}>
                      <Typography fontWeight={700}>{item.name}</Typography>
                      {!item.isActive && (
                        <Chip label="Inactivo" size="small" color="default" variant="outlined" />
                      )}
                      {item.itemType === 'combo' && (
                        <Chip label="Paquete" size="small" color="secondary" />
                      )}
                    </Box>
                    <Chip label={MENU_CATEGORY_LABELS[item.category]} size="small" sx={{ mb: 0.75 }} />
                    {item.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        {item.description}
                      </Typography>
                    )}
                    {item.comboIncludes && item.comboIncludes.length > 0 && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        Incluye: {item.comboIncludes.join(' · ')}
                      </Typography>
                    )}
                    <Typography variant="h6" fontWeight={800} color="error.main" sx={{ mt: 1 }}>
                      {formatCurrency(item.price)}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <IconButton color="primary" onClick={() => openEdit(item)} aria-label="Editar">
                      <EditIcon />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDelete(item)} aria-label="Eliminar">
                      <DeleteOutlineIcon />
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Fab
        color="primary"
        aria-label="Nuevo producto"
        onClick={openCreate}
        sx={{
          position: 'fixed',
          right: 16,
          bottom: BOTTOM_NAV_CLEARANCE,
          display: { xs: 'flex', sm: 'none' },
        }}
      >
        <AddIcon />
      </Fab>

      <MenuItemFormDialog
        open={formOpen}
        item={editingItem}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
      />
    </Box>
  );
}

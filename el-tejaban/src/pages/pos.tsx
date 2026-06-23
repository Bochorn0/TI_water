import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Grid, Snackbar } from '@mui/material';
import { toast } from 'react-toastify';
import type { MenuCategory, MenuItem } from '@tejaban/types/menu.types';
import type { OrderType } from '@tejaban/types/order.types';
import { menuService } from '@tejaban/services/menu.service';
import { orderService } from '@tejaban/services/order.service';
import { MenuGrid } from '@tejaban/components/pos/menu-grid';
import { OrderCart, type CartLine } from '@tejaban/components/pos/order-cart';
import { tejabanPath } from '@tejaban/paths';

export default function PosPage() {
  const navigate = useNavigate();

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [category, setCategory] = useState<MenuCategory>('cahuamanta');
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [lines, setLines] = useState<CartLine[]>([]);
  const [orderType, setOrderType] = useState<OrderType>('mostrador');
  const [tableLabel, setTableLabel] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [addedFlash, setAddedFlash] = useState(false);

  useEffect(() => {
    menuService.getMenu().then(setMenuItems).finally(() => setLoadingMenu(false));
  }, []);

  const addItem = useCallback((item: MenuItem) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.menuItemId === item.id);
      if (existing) {
        return prev.map((l) =>
          l.menuItemId === item.id ? { ...l, quantity: l.quantity + 1 } : l,
        );
      }
      return [
        ...prev,
        { menuItemId: item.id, name: item.name, quantity: 1, unitPrice: item.price },
      ];
    });
    setAddedFlash(true);
  }, []);

  const handleQuantityChange = (menuItemId: number, quantity: number) => {
    if (quantity <= 0) {
      setLines((prev) => prev.filter((l) => l.menuItemId !== menuItemId));
      return;
    }
    setLines((prev) =>
      prev.map((l) => (l.menuItemId === menuItemId ? { ...l, quantity } : l)),
    );
  };

  const handleSubmit = async () => {
    if (lines.length === 0) return;
    if (orderType === 'mesa' && !tableLabel.trim()) {
      toast.error('Indica el número de mesa');
      return;
    }

    setSubmitting(true);
    try {
      const order = await orderService.createOrder({
        orderType,
        tableLabel: orderType === 'mesa' ? tableLabel.trim() : undefined,
        notes: notes.trim() || undefined,
        items: lines.map((l) => ({ menuItemId: l.menuItemId, quantity: l.quantity })),
      });
      toast.success(`Orden ${order.orderNumber} creada`);
      setLines([]);
      setNotes('');
      setTableLabel('');
      navigate(tejabanPath(`/orders/${order.id}`));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al crear orden');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ height: { md: 'calc(100dvh - 140px)' } }}>
      <Grid container spacing={2} sx={{ height: '100%' }}>
        <Grid item xs={12} md={7} lg={8} sx={{ height: { md: '100%' }, overflow: { md: 'auto' } }}>
          <MenuGrid
            items={menuItems}
            category={category}
            loading={loadingMenu}
            onCategoryChange={setCategory}
            onSelectItem={addItem}
          />
        </Grid>

        <Grid
          item
          xs={12}
          md={5}
          lg={4}
          sx={{
            height: { xs: 'auto', md: '100%' },
            position: { xs: 'sticky', md: 'relative' },
            bottom: { xs: 72, md: 'auto' },
            zIndex: 1,
          }}
        >
          <Box sx={{ height: { md: '100%' }, minHeight: { xs: 360, md: 0 } }}>
            <OrderCart
              lines={lines}
              orderType={orderType}
              tableLabel={tableLabel}
              notes={notes}
              onOrderTypeChange={setOrderType}
              onTableLabelChange={setTableLabel}
              onNotesChange={setNotes}
              onQuantityChange={handleQuantityChange}
              onRemoveLine={(id) => handleQuantityChange(id, 0)}
              onSubmit={handleSubmit}
              submitting={submitting}
            />
          </Box>
        </Grid>
      </Grid>

      <Snackbar
        open={addedFlash}
        autoHideDuration={800}
        message="Producto agregado"
        onClose={() => setAddedFlash(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}

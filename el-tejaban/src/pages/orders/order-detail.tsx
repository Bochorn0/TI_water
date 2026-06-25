import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  CircularProgress,
  Collapse,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import { toast } from 'react-toastify';
import { orderService } from '@tejaban/services/order.service';
import { menuService } from '@tejaban/services/menu.service';
import { paymentService } from '@tejaban/services/payment.service';
import type { MenuCategory, MenuItem } from '@tejaban/types/menu.types';
import type { Order, OrderStatus } from '@tejaban/types/order.types';
import { ORDER_STATUS_LABELS } from '@tejaban/types/order.types';
import { formatCurrency, formatDateTime } from '@tejaban/utils/format';
import { OrderStatusChip } from '@tejaban/components/orders/order-status-chip';
import { PaymentDialog } from '@tejaban/components/pos/payment-dialog';
import { MenuGrid } from '@tejaban/components/pos/menu-grid';
import { OrderReceiptDialog } from '@tejaban/components/orders/order-receipt-dialog';
import { tejabanPath } from '@tejaban/paths';
import type { Payment } from '@tejaban/types/payment.types';
import { ORDER_TYPE_LABELS } from '@tejaban/types/order.types';
import PrintIcon from '@mui/icons-material/Print';
import { printOrderTicket } from '@tejaban/utils/print-order-ticket';

const STATUS_FLOW: OrderStatus[] = ['abierta', 'en_preparacion', 'lista', 'cerrada'];

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const orderId = Number(id);

  const [order, setOrder] = useState<Order | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [lastPayment, setLastPayment] = useState<Payment | null>(null);
  const [notes, setNotes] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuCategory, setMenuCategory] = useState<MenuCategory>('cahuamanta');
  const [loadingMenu, setLoadingMenu] = useState(false);

  const loadOrder = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await orderService.getOrder(orderId);
      setOrder(data);
      if (data?.notes) setNotes(data.notes);
      if (!data) setLoadError('Orden no encontrada');
    } catch (e) {
      setOrder(null);
      setLoadError(e instanceof Error ? e.message : 'No se pudo cargar la orden');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const loadMenu = useCallback(async () => {
    if (menuItems.length > 0) return;
    setLoadingMenu(true);
    try {
      const items = await menuService.getMenu();
      setMenuItems(items);
    } finally {
      setLoadingMenu(false);
    }
  }, [menuItems.length]);

  const isEditable = order?.status === 'abierta';
  const canPay = order && order.status !== 'cerrada' && order.status !== 'cancelada';

  const handleStatusChange = async (status: OrderStatus) => {
    try {
      const updated = await orderService.updateOrder(orderId, { status, notes: notes.trim() || undefined });
      setOrder(updated);
      toast.success(`Estado: ${ORDER_STATUS_LABELS[status]}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    }
  };

  const handleItemQty = async (itemId: number, quantity: number) => {
    try {
      const updated =
        quantity <= 0
          ? await orderService.removeOrderItem(orderId, itemId)
          : await orderService.updateOrderItem(orderId, itemId, { quantity });
      setOrder(updated);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    try {
      const updated = await orderService.removeOrderItem(orderId, itemId);
      setOrder(updated);
      toast.info('Producto eliminado');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    }
  };

  const handleAddProduct = async (item: MenuItem) => {
    try {
      const updated = await orderService.addOrderItem(orderId, { menuItemId: item.id, quantity: 1 });
      setOrder(updated);
      toast.success(`${item.name} agregado`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    }
  };

  const handleToggleMenu = async () => {
    if (!menuOpen) await loadMenu();
    setMenuOpen((v) => !v);
  };

  const handlePayment = async (payload: {
    method: import('@tejaban/types/payment.types').PaymentMethod;
    amount: number;
    terminalTicketRef?: string;
  }) => {
    const { order: updated, payment } = await paymentService.createPayment(orderId, payload);
    setOrder(updated);
    setLastPayment(payment);
    setReceiptOpen(true);
    toast.success('Pago registrado');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!order) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography>{loadError ?? 'Orden no encontrada'}</Typography>
        <Button onClick={() => navigate(tejabanPath('/orders'))} sx={{ mt: 2 }}>
          Volver
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <IconButton onClick={() => navigate(tejabanPath('/orders'))} aria-label="Volver">
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" fontWeight={800}>
            {order.orderNumber}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {formatDateTime(order.createdAt)}
            {' · '}
            {ORDER_TYPE_LABELS[order.orderType]}
            {order.tableLabel ? ` · ${order.tableLabel}` : ''}
          </Typography>
        </Box>
        <OrderStatusChip status={order.status} />
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 3, p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="h6" fontWeight={700}>
                Productos
              </Typography>
              {isEditable && (
                <Button
                  size="small"
                  variant={menuOpen ? 'contained' : 'outlined'}
                  startIcon={<RestaurantMenuIcon />}
                  onClick={handleToggleMenu}
                >
                  {menuOpen ? 'Ocultar menú' : 'Agregar productos'}
                </Button>
              )}
            </Box>

            {order.items.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 2 }}>
                Sin productos. {isEditable ? 'Agrega desde el menú.' : ''}
              </Typography>
            ) : (
              <List disablePadding>
                {order.items.map((item) => (
                  <ListItem
                    key={item.id}
                    sx={{ px: 0, alignItems: 'flex-start', gap: 1 }}
                    secondaryAction={
                      isEditable ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleItemQty(item.id, item.quantity - 1)}
                            aria-label="Reducir cantidad"
                          >
                            <RemoveIcon fontSize="small" />
                          </IconButton>
                          <Typography fontWeight={700} sx={{ minWidth: 24, textAlign: 'center' }}>
                            {item.quantity}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => handleItemQty(item.id, item.quantity + 1)}
                            aria-label="Aumentar cantidad"
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveItem(item.id)}
                            aria-label="Eliminar producto"
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ) : undefined
                    }
                  >
                    <ListItemText
                      primary={item.menuItem?.name ?? item.manualName}
                      secondary={`${formatCurrency(item.unitPrice)} c/u`}
                    />
                    <Typography fontWeight={700}>{formatCurrency(item.subtotal)}</Typography>
                  </ListItem>
                ))}
              </List>
            )}

            <Collapse in={menuOpen && isEditable}>
              <Divider sx={{ my: 2 }} />
              <MenuGrid
                items={menuItems}
                category={menuCategory}
                loading={loadingMenu}
                onCategoryChange={setMenuCategory}
                onSelectItem={handleAddProduct}
              />
            </Collapse>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6">Total</Typography>
              <Typography variant="h5" fontWeight={800} color="primary.main">
                {formatCurrency(order.total)}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 3, p: 2, mb: 2 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Estado
            </Typography>
            <ToggleButtonGroup
              exclusive
              value={order.status}
              onChange={(_, v) => v && handleStatusChange(v)}
              orientation="vertical"
              fullWidth
              disabled={order.status === 'cerrada' || order.status === 'cancelada'}
              sx={{ gap: 1 }}
            >
              {STATUS_FLOW.filter((s) => s !== 'cerrada').map((s) => (
                <ToggleButton key={s} value={s} sx={{ minHeight: 48, justifyContent: 'flex-start', px: 2 }}>
                  {ORDER_STATUS_LABELS[s]}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Paper>

          {isEditable && (
            <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 3, p: 2, mb: 2 }}>
              <TextField
                label="Notas"
                fullWidth
                multiline
                minRows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={() => orderService.updateOrder(orderId, { notes: notes.trim() || undefined }).then(setOrder)}
              />
            </Paper>
          )}

          {canPay && (
            <Button
              variant="contained"
              color="success"
              size="large"
              fullWidth
              onClick={() => setPaymentOpen(true)}
              sx={{ minHeight: 56 }}
            >
              Cobrar {formatCurrency(order.total)}
            </Button>
          )}

          {order.status === 'cerrada' && (
            <>
              <Typography variant="body2" color="success.main" sx={{ mt: 2, textAlign: 'center', fontWeight: 600 }}>
                Orden cerrada {order.closedAt ? formatDateTime(order.closedAt) : ''}
              </Typography>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<PrintIcon />}
                sx={{ mt: 2 }}
                onClick={() => {
                  try {
                    printOrderTicket(order, lastPayment);
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : 'No se pudo imprimir');
                  }
                }}
              >
                Imprimir ticket
              </Button>
            </>
          )}
        </Grid>
      </Grid>

      <PaymentDialog
        open={paymentOpen}
        orderNumber={order.orderNumber}
        total={order.total}
        onClose={() => setPaymentOpen(false)}
        onConfirm={handlePayment}
      />

      <OrderReceiptDialog
        open={receiptOpen}
        order={order}
        payment={lastPayment}
        onClose={() => setReceiptOpen(false)}
      />
    </Box>
  );
}

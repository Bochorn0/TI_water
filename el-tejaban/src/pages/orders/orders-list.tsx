import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Skeleton,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { orderService } from '@tejaban/services/order.service';
import type { Order, OrderStatus } from '@tejaban/types/order.types';
import { formatCurrency, formatDateTime } from '@tejaban/utils/format';
import { OrderStatusChip } from '@tejaban/components/orders/order-status-chip';
import { tejabanPath } from '@tejaban/paths';

const FILTERS: Array<{ label: string; value: OrderStatus | 'all' | 'active' }> = [
  { label: 'Activas', value: 'active' },
  { label: 'Todas hoy', value: 'all' },
  { label: 'Abierta', value: 'abierta' },
  { label: 'En prep.', value: 'en_preparacion' },
  { label: 'Lista', value: 'lista' },
  { label: 'Cerrada', value: 'cerrada' },
];

const VALID_FILTERS = new Set(FILTERS.map((f) => f.value));

export default function OrdersListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialFilter = searchParams.get('filter');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['value']>(() =>
    initialFilter && VALID_FILTERS.has(initialFilter as (typeof FILTERS)[number]['value'])
      ? (initialFilter as (typeof FILTERS)[number]['value'])
      : 'active',
  );

  useEffect(() => {
    setLoading(true);
    orderService
      .getOrders({ today: true })
      .then((data) => setOrders(data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = searchParams.get('filter');
    if (q && VALID_FILTERS.has(q as (typeof FILTERS)[number]['value'])) {
      setFilter(q as (typeof FILTERS)[number]['value']);
    }
  }, [searchParams]);

  const filtered = orders.filter((o) => {
    if (filter === 'all') return true;
    if (filter === 'active') return o.status !== 'cerrada' && o.status !== 'cancelada';
    return o.status === filter;
  });

  return (
    <Box>
      <Typography variant="h5" fontWeight={800} gutterBottom>
        Órdenes
      </Typography>

      <Tabs
        value={filter}
        onChange={(_, v) => setFilter(v)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{ mb: 2, minHeight: 48 }}
      >
        {FILTERS.map((f) => (
          <Tab key={f.value} label={f.label} value={f.value} sx={{ minHeight: 48 }} />
        ))}
      </Tabs>

      {loading ? (
        [...Array(4)].map((_, i) => <Skeleton key={i} height={88} sx={{ mb: 1.5, borderRadius: 2 }} />)
      ) : filtered.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          No hay órdenes con este filtro.
        </Typography>
      ) : (
        filtered.map((order) => (
          <Card
            key={order.id}
            elevation={0}
            sx={{ mb: 1.5, border: 1, borderColor: 'divider' }}
          >
            <CardActionArea onClick={() => navigate(tejabanPath(`/orders/${order.id}`))}>
              <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="h6" fontWeight={800}>
                      {order.orderNumber}
                    </Typography>
                    <OrderStatusChip status={order.status} />
                    {order.tableLabel && (
                      <Chip label={order.tableLabel} size="small" variant="outlined" />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {formatDateTime(order.createdAt)} · {order.items.length} productos
                    {order.createdBy ? ` · ${order.createdBy}` : ''}
                  </Typography>
                </Box>
                <Typography variant="h6" fontWeight={800} color="primary.main">
                  {formatCurrency(order.total)}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        ))
      )}
    </Box>
  );
}

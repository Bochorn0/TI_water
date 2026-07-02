import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardActionArea,
  Chip,
  Skeleton,
  Typography,
} from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import { DateRangeFilter } from '@tejaban/components/filters/date-range-filter';
import { SegmentedFilterTabs } from '@tejaban/components/filters/segmented-filter-tabs';
import { UserFilter } from '@tejaban/components/filters/user-filter';
import { EmptyState } from '@tejaban/components/layout/empty-state';
import { FilterPanel } from '@tejaban/components/layout/filter-panel';
import { PageHeader } from '@tejaban/components/layout/page-header';
import { orderService } from '@tejaban/services/order.service';
import type { Order, OrderStatus } from '@tejaban/types/order.types';
import {
  formatDateRangeLabel,
  resolveDateRange,
  todayIso,
  type DateRange,
  type DateRangePreset,
} from '@tejaban/utils/date-range';
import { formatCurrency, formatDateTime } from '@tejaban/utils/format';
import { OrderStatusChip } from '@tejaban/components/orders/order-status-chip';
import { tejabanPath } from '@tejaban/paths';

const FILTERS: Array<{ label: string; value: OrderStatus | 'all' | 'active' }> = [
  { label: 'Activas', value: 'active' },
  { label: 'Todas', value: 'all' },
  { label: 'Abierta', value: 'abierta' },
  { label: 'En prep.', value: 'en_preparacion' },
  { label: 'Lista', value: 'lista' },
  { label: 'Cerrada', value: 'cerrada' },
];

const VALID_FILTERS = new Set(FILTERS.map((f) => f.value));

const STATUS_ACCENT: Record<OrderStatus, string> = {
  abierta: '#0B4F8C',
  en_preparacion: '#FFB300',
  lista: '#00BCD4',
  cerrada: '#43A047',
  cancelada: '#E53935',
};

function orderItemCount(order: Order): number {
  return order.itemCount ?? order.items.length;
}

function matchesOrderFilter(
  order: Order,
  filterValue: (typeof FILTERS)[number]['value'],
): boolean {
  if (filterValue === 'all') return true;
  if (filterValue === 'active') return order.status !== 'cerrada' && order.status !== 'cancelada';
  return order.status === filterValue;
}

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
  const [datePreset, setDatePreset] = useState<DateRangePreset>('today');
  const [customRange, setCustomRange] = useState<DateRange>({
    fromDate: todayIso(),
    toDate: todayIso(),
  });
  const [userFilter, setUserFilter] = useState('');

  const dateRange = useMemo(
    () => resolveDateRange(datePreset, customRange),
    [datePreset, customRange],
  );

  useEffect(() => {
    const q = searchParams.get('filter');
    if (q && VALID_FILTERS.has(q as (typeof FILTERS)[number]['value'])) {
      setFilter(q as (typeof FILTERS)[number]['value']);
    }
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    orderService
      .getOrders({
        fromDate: dateRange.fromDate,
        toDate: dateRange.toDate,
        createdBy: userFilter || undefined,
      })
      .then((data) => setOrders(data))
      .finally(() => setLoading(false));
  }, [dateRange.fromDate, dateRange.toDate, userFilter]);

  const users = useMemo(
    () =>
      [...new Set(orders.map((o) => o.createdBy).filter(Boolean) as string[])].sort((a, b) =>
        a.localeCompare(b),
      ),
    [orders],
  );

  const filterCounts = useMemo(
    () =>
      Object.fromEntries(
        FILTERS.map((f) => [f.value, orders.filter((o) => matchesOrderFilter(o, f.value)).length]),
      ) as Record<(typeof FILTERS)[number]['value'], number>,
    [orders],
  );

  const filtered = orders.filter((o) => matchesOrderFilter(o, filter));
  const totalAmount = filtered.reduce((sum, order) => sum + order.total, 0);

  const statusTabs = FILTERS.map((f) => ({
    label: f.label,
    value: f.value,
    count: filterCounts[f.value],
  }));

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', width: '100%' }}>
      <PageHeader
        title="Órdenes"
        subtitle={`${formatDateRangeLabel(dateRange)} · ${filtered.length} en vista`}
      />

      <FilterPanel>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1.5,
            alignItems: 'center',
            mb: 2,
          }}
        >
          <DateRangeFilter
            preset={datePreset}
            customRange={customRange}
            onPresetChange={setDatePreset}
            onCustomRangeChange={setCustomRange}
          />
          <UserFilter
            label="Usuario"
            value={userFilter}
            users={users}
            onChange={setUserFilter}
          />
        </Box>

        <SegmentedFilterTabs tabs={statusTabs} value={filter} onChange={setFilter} />
      </FilterPanel>

      {!loading && filtered.length > 0 && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 1.5,
            px: 0.5,
          }}
        >
          <Typography variant="body2" color="text.secondary" fontWeight={600}>
            {filtered.length} {filtered.length === 1 ? 'orden' : 'órdenes'}
          </Typography>
          <Typography variant="body2" fontWeight={700} color="primary.main">
            Total {formatCurrency(totalAmount)}
          </Typography>
        </Box>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} height={96} sx={{ borderRadius: 3 }} />
          ))}
        </Box>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<ReceiptLongOutlinedIcon />}
          title="No hay órdenes con este filtro"
          description="Prueba otro periodo, usuario o estado para ver más resultados."
        />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {filtered.map((order) => (
            <Card
              key={order.id}
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 3,
                overflow: 'hidden',
                transition: 'box-shadow 0.15s ease, transform 0.15s ease',
                '&:hover': {
                  boxShadow: '0 4px 16px rgba(11, 79, 140, 0.1)',
                  transform: 'translateY(-1px)',
                },
              }}
            >
              <CardActionArea onClick={() => navigate(tejabanPath(`/orders/${order.id}`))}>
                <Box sx={{ display: 'flex', alignItems: 'stretch' }}>
                  <Box
                    sx={{
                      width: 4,
                      flexShrink: 0,
                      bgcolor: STATUS_ACCENT[order.status],
                    }}
                  />
                  <Box
                    sx={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      p: 2,
                      minWidth: 0,
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
                        <Typography variant="subtitle1" fontWeight={800} letterSpacing="-0.01em">
                          {order.orderNumber}
                        </Typography>
                        <OrderStatusChip status={order.status} />
                        {order.tableLabel && (
                          <Chip label={order.tableLabel} size="small" variant="outlined" />
                        )}
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {formatDateTime(order.createdAt)}
                        {' · '}
                        {orderItemCount(order)} {orderItemCount(order) === 1 ? 'producto' : 'productos'}
                        {order.createdBy ? ` · ${order.createdBy}` : ''}
                      </Typography>
                    </Box>

                    <Box sx={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6" fontWeight={800} color="primary.main" lineHeight={1.2}>
                        {formatCurrency(order.total)}
                      </Typography>
                      <ChevronRightIcon sx={{ color: 'text.disabled', fontSize: 22 }} />
                    </Box>
                  </Box>
                </Box>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Grid,
  Skeleton,
  Typography,
} from '@mui/material';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import { useAuth } from '@tejaban/auth/auth-context';
import { displayName, roleLabel } from '@tejaban/auth/permissions';
import { PERMISSION_ADMIN, PERMISSION_POS } from '@tejaban/types/auth.types';
import { tejabanPath } from '@tejaban/paths';
import { orderService } from '@tejaban/services/order.service';
import { paymentService } from '@tejaban/services/payment.service';
import type { DailySummary } from '@tejaban/types/payment.types';
import type { Order } from '@tejaban/types/order.types';
import { formatCurrency, formatTime } from '@tejaban/utils/format';
import { OrderStatusChip } from '@tejaban/components/orders/order-status-chip';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { hasPermission, user } = useAuth();
  const canViewAccounting = hasPermission(PERMISSION_ADMIN);
  const canManageMenu = hasPermission(PERMISSION_ADMIN);

  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const requests: [Promise<DailySummary> | null, Promise<Order[]>] = [
      canViewAccounting ? paymentService.getDailySummary() : null,
      orderService.getOrders({ today: true }),
    ];

    Promise.all([
      requests[0] ?? Promise.resolve(null),
      requests[1],
    ])
      .then(([s, orders]) => {
        if (s) setSummary(s);
        setRecentOrders(orders.slice(0, 5));
      })
      .finally(() => setLoading(false));
  }, [canViewAccounting]);

  return (
    <Box>
      <Typography variant="h5" fontWeight={800} gutterBottom>
        Hola, {displayName(user).split(' ')[0]}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {roleLabel(user)} · Resumen del día
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {canViewAccounting && (
          <>
            <Grid item xs={6} md={3}>
              <StatCard
                loading={loading}
                label="Ventas"
                value={summary ? formatCurrency(summary.totalSales) : '—'}
                icon={<AttachMoneyIcon />}
                color="#43A047"
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <StatCard
                loading={loading}
                label="Efectivo"
                value={summary ? formatCurrency(summary.cashTotal) : '—'}
                icon={<AttachMoneyIcon />}
                color="#0B4F8C"
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <StatCard
                loading={loading}
                label="Tarjeta"
                value={summary ? formatCurrency(summary.cardTotal) : '—'}
                icon={<AttachMoneyIcon />}
                color="#E53935"
              />
            </Grid>
          </>
        )}
        <Grid item xs={6} md={canViewAccounting ? 3 : 6}>
          <StatCard
            loading={loading}
            label="Órdenes abiertas"
            value={summary ? String(summary.openOrderCount) : loading ? '—' : String(recentOrders.filter((o) => o.status !== 'cerrada' && o.status !== 'cancelada').length)}
            icon={<PendingActionsIcon />}
            color="#FFB300"
          />
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {hasPermission(PERMISSION_POS) && (
          <Grid item xs={12} sm={6}>
            <QuickAction
              title="Nueva orden"
              subtitle="Abrir punto de venta"
              icon={<PointOfSaleIcon sx={{ fontSize: 40 }} />}
              onClick={() => navigate(tejabanPath('/pos'))}
            />
          </Grid>
        )}
        {hasPermission(PERMISSION_POS) && (
          <Grid item xs={12} sm={6}>
            <QuickAction
              title="Ver órdenes"
              subtitle="Modificar y cobrar"
              icon={<ReceiptLongIcon sx={{ fontSize: 40 }} />}
              onClick={() => navigate(tejabanPath('/orders'))}
            />
          </Grid>
        )}
        {canManageMenu && (
          <Grid item xs={12} sm={6}>
            <QuickAction
              title="Administrar menú"
              subtitle="Precios, productos y paquetes"
              icon={<RestaurantMenuIcon sx={{ fontSize: 40 }} />}
              onClick={() => navigate(tejabanPath('/menu'))}
              color="secondary.main"
            />
          </Grid>
        )}
      </Grid>

      <Typography variant="h6" fontWeight={700} gutterBottom>
        Órdenes recientes
      </Typography>

      {loading ? (
        [...Array(3)].map((_, i) => <Skeleton key={i} height={72} sx={{ mb: 1, borderRadius: 2 }} />)
      ) : recentOrders.length === 0 ? (
        <Typography color="text.secondary">No hay órdenes hoy.</Typography>
      ) : (
        recentOrders.map((order) => (
          <Card key={order.id} sx={{ mb: 1.5, border: 1, borderColor: 'divider' }} elevation={0}>
            <CardActionArea onClick={() => navigate(tejabanPath(`/orders/${order.id}`))} sx={{ p: 0 }}>
              <CardContent
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2,
                  py: 2,
                }}
              >
                <Box>
                  <Typography fontWeight={700}>{order.orderNumber}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatTime(order.createdAt)}
                    {order.tableLabel ? ` · ${order.tableLabel}` : ''}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <OrderStatusChip status={order.status} />
                  <Typography fontWeight={800} sx={{ mt: 0.5 }}>
                    {formatCurrency(order.total)}
                  </Typography>
                </Box>
              </CardContent>
            </CardActionArea>
          </Card>
        ))
      )}
    </Box>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
  loading,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
}) {
  return (
    <Card elevation={0} sx={{ border: 1, borderColor: 'divider', height: '100%' }}>
      <CardContent>
        {loading ? (
          <Skeleton height={80} />
        ) : (
          <>
            <Box sx={{ color, mb: 1 }}>{icon}</Box>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="h5" fontWeight={800}>
              {value}
            </Typography>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function QuickAction({
  title,
  subtitle,
  icon,
  onClick,
  color = 'primary.main',
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onClick: () => void;
  color?: string;
}) {
  return (
    <Button
      variant="contained"
      onClick={onClick}
      fullWidth
      sx={{
        py: 3,
        justifyContent: 'flex-start',
        textAlign: 'left',
        bgcolor: color,
        borderRadius: 3,
        '&:hover': { filter: 'brightness(0.92)' },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {icon}
        <Box>
          <Typography variant="h6" fontWeight={800}>
            {title}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.85 }}>
            {subtitle}
          </Typography>
        </Box>
      </Box>
    </Button>
  );
}

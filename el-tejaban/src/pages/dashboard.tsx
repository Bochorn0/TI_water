import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
  Skeleton,
  Typography,
  alpha,
} from '@mui/material';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
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
import { desktopNavSx } from '@tejaban/layout/breakpoints';

type TileConfig = {
  id: string;
  label: string;
  value: string;
  hint?: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
  loading?: boolean;
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { hasPermission, user } = useAuth();
  const canViewAccounting = hasPermission(PERMISSION_ADMIN);

  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [salesOpen, setSalesOpen] = useState(false);

  useEffect(() => {
    const requests: [Promise<DailySummary> | null, Promise<Order[]>] = [
      canViewAccounting ? paymentService.getDailySummary() : null,
      orderService.getOrders({ today: true }),
    ];

    Promise.all([requests[0] ?? Promise.resolve(null), requests[1]])
      .then(([s, orders]) => {
        if (s) setSummary(s);
        setRecentOrders(orders.slice(0, 5));
      })
      .finally(() => setLoading(false));
  }, [canViewAccounting]);

  const openOrderCount =
    summary?.openOrderCount ??
    recentOrders.filter((o) => o.status !== 'cerrada' && o.status !== 'cancelada').length;

  /** Four primary actions — accounting tiles only for admin */
  const mainTiles: TileConfig[] = [
    ...(hasPermission(PERMISSION_POS)
      ? [
          {
            id: 'pos',
            label: 'Nueva orden',
            value: 'POS',
            hint: 'Punto de venta',
            icon: <PointOfSaleIcon />,
            color: '#0B4F8C',
            onClick: () => navigate(tejabanPath('/pos')),
          },
          {
            id: 'abiertas',
            label: 'Órdenes abiertas',
            value: loading ? '—' : String(openOrderCount),
            hint: 'Ver activas',
            icon: <PendingActionsIcon />,
            color: '#FFB300',
            onClick: () => navigate(`${tejabanPath('/orders')}?filter=active`),
            loading,
          },
        ]
      : []),
    ...(canViewAccounting
      ? [
          {
            id: 'ventas',
            label: 'Ventas hoy',
            value: summary ? formatCurrency(summary.totalSales) : '—',
            hint: 'Ver detalle',
            icon: <AttachMoneyIcon />,
            color: '#43A047',
            onClick: () => setSalesOpen(true),
            loading,
          },
          {
            id: 'menu',
            label: 'Menú',
            value: 'Admin',
            hint: 'Productos y precios',
            icon: <RestaurantMenuIcon />,
            color: '#00BCD4',
            onClick: () => navigate(tejabanPath('/menu')),
          },
        ]
      : []),
  ];

  return (
    <Box sx={{ maxWidth: 1120, mx: 'auto', width: '100%' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={800} sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
          Hola, {displayName(user).split(' ')[0]}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {roleLabel(user)} · Resumen del día
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 3,
          alignItems: 'start',
          [desktopNavSx]: {
            gridTemplateColumns: '1fr 340px',
          },
        }}
      >
        <Box>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: `repeat(${Math.min(mainTiles.length, 2)}, 1fr)`,
                sm: `repeat(${mainTiles.length}, 1fr)`,
              },
              gap: 1.5,
              mb: 3,
              maxWidth: mainTiles.length <= 2 ? 360 : '100%',
            }}
          >
            {mainTiles.map((tile) => (
              <DashboardTile key={tile.id} {...tile} />
            ))}
          </Box>
        </Box>

        <Paper
          elevation={0}
          sx={{
            border: 1,
            borderColor: 'divider',
            borderRadius: 3,
            overflow: 'hidden',
            [desktopNavSx]: {
              position: 'sticky',
              top: 88,
            },
          }}
        >
          <Box
            sx={{
              px: 2,
              py: 1.5,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography fontWeight={700}>Órdenes recientes</Typography>
            <Button
              size="small"
              color="inherit"
              endIcon={<ChevronRightIcon />}
              onClick={() => navigate(tejabanPath('/orders'))}
              sx={{ opacity: 0.9 }}
            >
              Ver todas
            </Button>
          </Box>

          <Box sx={{ p: 1.5 }}>
            {loading ? (
              [...Array(3)].map((_, i) => (
                <Skeleton key={i} height={64} sx={{ mb: 1, borderRadius: 2 }} />
              ))
            ) : recentOrders.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                No hay órdenes hoy.
              </Typography>
            ) : (
              recentOrders.map((order, idx) => (
                <Card
                  key={order.id}
                  elevation={0}
                  sx={{
                    mb: idx < recentOrders.length - 1 ? 1 : 0,
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 2,
                  }}
                >
                  <CardActionArea onClick={() => navigate(tejabanPath(`/orders/${order.id}`))}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5 }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography fontWeight={700} noWrap>
                          {order.orderNumber}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {formatTime(order.createdAt)}
                          {order.tableLabel ? ` · ${order.tableLabel}` : ''}
                        </Typography>
                        <Box sx={{ mt: 0.75 }}>
                          <OrderStatusChip status={order.status} />
                        </Box>
                      </Box>
                      <Typography fontWeight={800} color="primary.main" sx={{ fontSize: '1.1rem' }}>
                        {formatCurrency(order.total)}
                      </Typography>
                    </Box>
                  </CardActionArea>
                </Card>
              ))
            )}
          </Box>
        </Paper>
      </Box>

      <SalesDetailDialog open={salesOpen} summary={summary} onClose={() => setSalesOpen(false)} />
    </Box>
  );
}

function DashboardTile({
  label,
  value,
  hint,
  icon,
  color,
  loading,
  onClick,
}: TileConfig) {
  return (
    <Card
      elevation={0}
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 2.5,
        overflow: 'hidden',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 3,
        },
        '&:active': {
          transform: 'translateY(0)',
        },
      }}
    >
      <CardActionArea onClick={onClick} sx={{ height: '100%' }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            p: 2,
            minHeight: 148,
            justifyContent: 'center',
            gap: 1,
          }}
        >
          {loading ? (
            <Skeleton variant="rounded" width={52} height={52} />
          ) : (
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(color, 0.12),
                color,
                '& svg': { fontSize: 28 },
              }}
            >
              {icon}
            </Box>
          )}

          {loading ? (
            <Skeleton width="70%" height={40} />
          ) : (
            <>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}
              >
                {label}
              </Typography>
              <Typography variant="h6" fontWeight={800} lineHeight={1.1} sx={{ fontSize: '1.15rem' }}>
                {value}
              </Typography>
              {hint && (
                <Typography variant="caption" color="primary.main" fontWeight={600}>
                  {hint}
                </Typography>
              )}
            </>
          )}
        </Box>
      </CardActionArea>
    </Card>
  );
}

function SalesDetailDialog({
  open,
  summary,
  onClose,
}: {
  open: boolean;
  summary: DailySummary | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle fontWeight={800}>Detalle de ventas — hoy</DialogTitle>
      <DialogContent>
        {!summary ? (
          <Typography color="text.secondary">Sin datos de ventas.</Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Row label="Ventas totales" value={formatCurrency(summary.totalSales)} bold />
            <Divider />
            <Row label="Efectivo" value={formatCurrency(summary.cashTotal)} />
            <Row label="Tarjeta" value={formatCurrency(summary.cardTotal)} />
            <Row label="Transferencia" value={formatCurrency(summary.transferTotal)} />
            <Row label="Uber Eats" value={formatCurrency(summary.uberEatsTotal)} />
            <Row label="DiDi Food" value={formatCurrency(summary.didiTotal)} />
            <Row label="Rappi" value={formatCurrency(summary.rapiTotal)} />
            <Divider />
            <Row label="Órdenes hoy" value={String(summary.orderCount)} />
            <Row label="Cerradas" value={String(summary.closedOrderCount)} />
            <Row label="Abiertas" value={String(summary.openOrderCount)} />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
      <Typography color="text.secondary">{label}</Typography>
      <Typography fontWeight={bold ? 800 : 600}>{value}</Typography>
    </Box>
  );
}

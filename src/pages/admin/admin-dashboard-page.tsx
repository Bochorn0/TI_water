import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import SendIcon from '@mui/icons-material/Send';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { productService } from 'src/services/product.service';
import { quoteService } from 'src/services/quote.service';
import { getSiteHitsLast7Days } from 'src/utils/site-visits';
import {
  canManageTiwaterCatalog,
  canManageTiwaterQuotes,
  canManageUsersAndRoles,
} from 'src/auth/permissions';
import { useAuth } from 'src/auth/auth-context';

type ProductStats = {
  total: number;
  active: number;
  inactive: number;
  byCategory: Record<string, number>;
};

export function AdminDashboardPage() {
  const { user } = useAuth();
  const showCatalog = canManageTiwaterCatalog(user);
  const showQuotes = canManageTiwaterQuotes(user);
  const showUsers = canManageUsersAndRoles(user);

  const [productStats, setProductStats] = useState<ProductStats | null>(null);
  const [quoteStats, setQuoteStats] = useState<{ total: number; pendiente: number; enviada: number } | null>(
    null,
  );
  const [visits, setVisits] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setVisits(getSiteHitsLast7Days());
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const tasks: Promise<void>[] = [];
        if (showCatalog) {
          tasks.push(
            productService.getStats().then((s) => {
              if (!cancelled) setProductStats(s);
            }),
          );
        }
        if (showQuotes) {
          tasks.push(
            quoteService.getStats().then((s) => {
              if (!cancelled) {
                setQuoteStats({
                  total: s.total,
                  pendiente: s.byStatus?.pendiente ?? 0,
                  enviada: s.byStatus?.enviada ?? 0,
                });
              }
            }),
          );
        }
        await Promise.all(tasks);
      } catch {
        /* individual pages show errors; dashboard stays partial */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showCatalog, showQuotes]);

  const categories = ['general', 'presurizadores', 'valvulas_sistemas', 'sumergibles', 'plomeria'];
  const maxCat = Math.max(
    1,
    ...categories.map((c) => productStats?.byCategory?.[c] ?? 0),
  );

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }} flexWrap="wrap" gap={2}>
        <div>
          <Typography variant="h4" fontWeight={700} sx={{ letterSpacing: '-0.02em' }}>
            Resumen
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Métricas y accesos rápidos del sitio TI Water
          </Typography>
        </div>
        {loading && (
          <Box sx={{ width: { xs: '100%', sm: 200 } }}>
            <LinearProgress />
          </Box>
        )}
      </Stack>

      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {showQuotes && (
          <Grid item xs={12} sm={6} lg={3}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 4px 24px rgba(15, 23, 42, 0.06)',
                height: '100%',
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                    Por aprobar
                  </Typography>
                  <Chip size="small" icon={<PendingActionsIcon />} label="Cotizaciones" variant="outlined" />
                </Stack>
                <Typography variant="h3" fontWeight={800} sx={{ my: 1, color: 'warning.dark' }}>
                  {quoteStats?.pendiente ?? '—'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Pendientes de respuesta del equipo
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

        {showCatalog && (
          <Grid item xs={12} sm={6} lg={3}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 4px 24px rgba(15, 23, 42, 0.06)',
                height: '100%',
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                    Catálogo activo
                  </Typography>
                  <Chip size="small" icon={<Inventory2Icon />} label="Productos" variant="outlined" />
                </Stack>
                <Typography variant="h3" fontWeight={800} sx={{ my: 1 }}>
                  {productStats?.active ?? '—'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  De {productStats?.total ?? '—'} productos en total
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

        {showQuotes && (
          <Grid item xs={12} sm={6} lg={3}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 4px 24px rgba(15, 23, 42, 0.06)',
                height: '100%',
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                    Enviadas
                  </Typography>
                  <Chip size="small" icon={<SendIcon />} label="Cotizaciones" variant="outlined" />
                </Stack>
                <Typography variant="h3" fontWeight={800} sx={{ my: 1, color: 'success.dark' }}>
                  {quoteStats?.enviada ?? '—'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Respuestas ya enviadas a clientes
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

        <Grid item xs={12} sm={6} lg={3}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 4px 24px rgba(15, 23, 42, 0.06)',
              height: '100%',
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                  Tráfico (7 días)
                </Typography>
                <Chip size="small" icon={<VisibilityIcon />} label="Sesiones" variant="outlined" />
              </Stack>
              <Typography variant="h3" fontWeight={800} sx={{ my: 1 }}>
                {visits}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Aproximación en este navegador; integra analytics para datos reales
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        {showCatalog && productStats && (
          <Grid item xs={12} lg={7}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 4px 24px rgba(15, 23, 42, 0.06)',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <TrendingUpIcon color="primary" />
                  <Typography variant="h6" fontWeight={700}>
                    Productos por categoría
                  </Typography>
                </Stack>
                <Stack spacing={1.5}>
                  {categories.map((cat) => {
                    const n = productStats.byCategory?.[cat] ?? 0;
                    const pct = Math.round((n / maxCat) * 100);
                    return (
                      <Box key={cat}>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                          <Typography variant="body2" color="text.secondary">
                            {cat.replace(/_/g, ' ')}
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {n}
                          </Typography>
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={pct}
                          sx={{
                            height: 8,
                            borderRadius: 1,
                            bgcolor: 'grey.100',
                            '& .MuiLinearProgress-bar': { borderRadius: 1 },
                          }}
                        />
                      </Box>
                    );
                  })}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        )}

        <Grid item xs={12} lg={showCatalog && productStats ? 5 : 12}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 4px 24px rgba(15, 23, 42, 0.06)',
              height: '100%',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Acciones rápidas
              </Typography>
              <Stack spacing={1.5}>
                {showQuotes && (
                  <Button
                    component={RouterLink}
                    to="/admin/cotizaciones"
                    variant="contained"
                    size="large"
                    fullWidth
                    sx={{ py: 1.5, borderRadius: 2 }}
                  >
                    <Box component="span" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                      Revisar cotizaciones
                      {quoteStats != null && quoteStats.pendiente > 0 && (
                        <Chip component="span" label={quoteStats.pendiente} size="small" color="warning" />
                      )}
                    </Box>
                  </Button>
                )}
                {showCatalog && (
                  <>
                    <Button
                      component={RouterLink}
                      to="/admin/catalogo"
                      variant="outlined"
                      size="large"
                      fullWidth
                      sx={{ py: 1.5, borderRadius: 2 }}
                    >
                      Ir al catálogo
                    </Button>
                    <Button
                      component={RouterLink}
                      to="/admin/catalogo/nuevo"
                      variant="outlined"
                      size="large"
                      fullWidth
                      sx={{ py: 1.5, borderRadius: 2 }}
                    >
                      Añadir producto
                    </Button>
                  </>
                )}
                {showUsers && (
                  <Button
                    component={RouterLink}
                    to="/admin/usuarios"
                    variant="outlined"
                    size="large"
                    fullWidth
                    sx={{ py: 1.5, borderRadius: 2 }}
                  >
                    Gestionar usuarios
                  </Button>
                )}
                <Button
                  component={RouterLink}
                  to="/admin/ajustes"
                  variant="text"
                  size="large"
                  fullWidth
                  sx={{ borderRadius: 2 }}
                >
                  Mi cuenta
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

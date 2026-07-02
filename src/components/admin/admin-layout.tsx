import { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Badge,
  Box,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import { useAuth } from 'src/auth/auth-context';
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined';
import {
  canManageSecretLinks,
  canManageTiwaterCatalog,
  canManageTiwaterQuotes,
  canManageUsersAndRoles,
} from 'src/auth/permissions';
import { quoteService } from 'src/services/quote.service';
import { Header } from 'src/components/header/header';
import { AdminSidebarOpenContext } from 'src/components/admin/admin-sidebar-context';

const DRAWER_WIDTH = 260;
const SITE_HEADER_OFFSET_PX = 100;

type NavItem = {
  label: string;
  path: string;
  icon: React.ReactNode;
  show: boolean;
  match: (pathname: string) => boolean;
};

export function AdminLayout() {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingQuotes, setPendingQuotes] = useState<number | null>(null);

  const showCatalog = canManageTiwaterCatalog(user);
  const showQuotes = canManageTiwaterQuotes(user);
  const showSecretLinks = canManageSecretLinks(user);
  const showUsers = canManageUsersAndRoles(user);

  useEffect(() => {
    if (!showQuotes) {
      setPendingQuotes(null);
      return;
    }
    let cancelled = false;
    quoteService
      .getStats()
      .then((s) => {
        if (!cancelled) setPendingQuotes(s.byStatus?.pendiente ?? 0);
      })
      .catch(() => {
        if (!cancelled) setPendingQuotes(null);
      });
    return () => {
      cancelled = true;
    };
  }, [showQuotes, location.pathname]);

  const navItems: NavItem[] = useMemo(
    () => [
      {
        label: 'Resumen',
        path: '/admin',
        icon: <DashboardRoundedIcon />,
        show: true,
        match: (p) => p === '/admin' || p === '/admin/',
      },
      {
        label: 'Catálogo',
        path: '/admin/catalogo',
        icon: <Inventory2OutlinedIcon />,
        show: showCatalog,
        match: (p) => p.startsWith('/admin/catalogo'),
      },
      {
        label: 'Cotizaciones',
        path: '/admin/cotizaciones',
        icon: <RequestQuoteIcon />,
        show: showQuotes,
        match: (p) => p.startsWith('/admin/cotizaciones'),
      },
      {
        label: 'Enlaces cifrados',
        path: '/admin/enlaces',
        icon: <VpnKeyOutlinedIcon />,
        show: showSecretLinks,
        match: (p) => p.startsWith('/admin/enlaces'),
      },
      {
        label: 'Usuarios',
        path: '/admin/usuarios',
        icon: <PeopleOutlineIcon />,
        show: showUsers,
        match: (p) => p.startsWith('/admin/usuarios'),
      },
      {
        label: 'Roles',
        path: '/admin/roles',
        icon: <AdminPanelSettingsOutlinedIcon />,
        show: showUsers,
        match: (p) => p.startsWith('/admin/roles'),
      },
      {
        label: 'Mi cuenta',
        path: '/admin/ajustes',
        icon: <PersonOutlineIcon />,
        show: true,
        match: (p) => p.startsWith('/admin/ajustes'),
      },
    ],
    [showCatalog, showQuotes, showSecretLinks, showUsers],
  );

  const visibleNav = navItems.filter((n) => n.show);

  const handleNav = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', pt: 2, pb: 2 }}>
      <Box sx={{ px: 2.5, mb: 3 }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 800,
            color: '#f8fafc',
            letterSpacing: '-0.03em',
            lineHeight: 1.2,
          }}
        >
          TI Water
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(248, 250, 252, 0.55)', display: 'block', mt: 0.5 }}>
          Panel administrativo
        </Typography>
      </Box>
      <Divider sx={{ borderColor: 'rgba(148, 163, 184, 0.15)', mx: 2 }} />
      <List sx={{ px: 1.5, pt: 2, flex: 1 }}>
        {visibleNav.map((item) => {
          const selected = item.match(location.pathname);
          return (
            <ListItemButton
              key={item.path + item.label}
              selected={selected}
              onClick={() => handleNav(item.path)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                py: 1.25,
                color: 'rgba(248, 250, 252, 0.85)',
                '&.Mui-selected': {
                  bgcolor: 'rgba(10, 124, 255, 0.18)',
                  color: '#fff',
                  borderLeft: '3px solid',
                  borderColor: 'primary.main',
                  pl: 1.25,
                },
                '&:hover': {
                  bgcolor: 'rgba(148, 163, 184, 0.12)',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ fontWeight: selected ? 700 : 500, fontSize: '0.9375rem' }}
              />
              {item.path === '/admin/cotizaciones' && pendingQuotes != null && pendingQuotes > 0 && (
                <Chip label={pendingQuotes} size="small" color="warning" sx={{ height: 22, fontSize: '0.7rem' }} />
              )}
            </ListItemButton>
          );
        })}
      </List>
      <Box sx={{ px: 2, pt: 1 }}>
        <Typography variant="caption" sx={{ color: 'rgba(148, 163, 184, 0.7)', display: 'block' }}>
          Solo visible para usuarios con acceso
        </Typography>
      </Box>
    </Box>
  );

  const drawerPaperSx = useMemo(
    () => ({
      width: DRAWER_WIDTH,
      boxSizing: 'border-box' as const,
      bgcolor: '#0f172a',
      borderRight: 'none',
      backgroundImage: 'linear-gradient(180deg, rgba(10, 124, 255, 0.06) 0%, transparent 35%)',
      ...(isMdUp
        ? { height: '100%', position: 'relative' as const }
        : {
            top: SITE_HEADER_OFFSET_PX,
            height: `calc(100vh - ${SITE_HEADER_OFFSET_PX}px)`,
          }),
    }),
    [isMdUp],
  );

  return (
    <AdminSidebarOpenContext.Provider value={() => setMobileOpen(true)}>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f1f5f9' }}>
        <Header />
        <Box
          sx={{
            display: 'flex',
            flex: 1,
            width: '100%',
            mt: `${SITE_HEADER_OFFSET_PX}px`,
            minHeight: `calc(100vh - ${SITE_HEADER_OFFSET_PX}px)`,
            alignSelf: 'stretch',
          }}
        >
          <Drawer
            variant={isMdUp ? 'permanent' : 'temporary'}
            open={isMdUp ? true : mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{
              width: DRAWER_WIDTH,
              flexShrink: 0,
              alignSelf: 'stretch',
              ...(isMdUp ? { display: 'flex' } : {}),
              '& .MuiDrawer-paper': drawerPaperSx,
            }}
          >
            {drawer}
          </Drawer>

          <Box
            component="main"
            sx={{
              flexGrow: 1,
              width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
              minWidth: 0,
              minHeight: `calc(100vh - ${SITE_HEADER_OFFSET_PX}px)`,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <AppBar
              position="sticky"
              elevation={0}
              sx={{
                display: { xs: 'none', md: 'block' },
                bgcolor: 'rgba(255, 255, 255, 0.92)',
                backdropFilter: 'blur(8px)',
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Toolbar sx={{ minHeight: 72, gap: 2, py: 1 }}>
                <Box sx={{ flex: 1, maxWidth: 420 }}>
                  <Box
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      px: 1.5,
                      py: 1,
                      display: 'flex',
                      alignItems: 'center',
                      bgcolor: 'grey.50',
                    }}
                  >
                    <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 22 }} />
                    <Typography variant="body2" color="text.secondary">
                      Buscar en el panel…
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ flexGrow: 1 }} />
                <Tooltip title="Cotizaciones pendientes">
                  <span>
                    <IconButton
                      color="inherit"
                      onClick={() => showQuotes && navigate('/admin/cotizaciones')}
                      disabled={!showQuotes}
                      sx={{ color: 'text.primary' }}
                    >
                      <Badge
                        badgeContent={pendingQuotes ?? 0}
                        color="warning"
                        invisible={pendingQuotes == null || pendingQuotes === 0}
                      >
                        <NotificationsNoneOutlinedIcon />
                      </Badge>
                    </IconButton>
                  </span>
                </Tooltip>
              </Toolbar>
            </AppBar>

            <Box
              sx={{
                flex: 1,
                p: { xs: 2, sm: 3 },
                pt: { xs: 2, md: 3 },
                maxWidth: 1400,
                width: '100%',
                mx: 'auto',
              }}
            >
              <Outlet />
            </Box>
          </Box>
        </Box>
      </Box>
    </AdminSidebarOpenContext.Provider>
  );
}

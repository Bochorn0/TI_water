import { useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  BottomNavigation,
  BottomNavigationAction,
  Chip,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
  alpha,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PaymentsIcon from '@mui/icons-material/Payments';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '@tejaban/auth/auth-context';
import { filterNavByPermissions, roleLabel, displayName } from '@tejaban/auth/permissions';
import { CONFIG } from '@tejaban/config-global';
import { TejabanLogo } from '@tejaban/components/tejaban-logo';
import { tejabanPath, tejabanRelativePath } from '@tejaban/paths';
import type { PermissionPath } from '@tejaban/types/auth.types';
import { PERMISSION_ADMIN, PERMISSION_POS } from '@tejaban/types/auth.types';
import { desktopNavMediaQuery } from '@tejaban/layout/breakpoints';

const RAIL_WIDTH = 64;

const ALL_NAV_ITEMS: Array<{
  label: string;
  value: string;
  icon: React.ReactNode;
  permission: PermissionPath;
}> = [
  { label: 'Inicio', value: tejabanPath('/'), icon: <DashboardIcon />, permission: PERMISSION_POS },
  { label: 'POS', value: tejabanPath('/pos'), icon: <PointOfSaleIcon />, permission: PERMISSION_POS },
  { label: 'Órdenes', value: tejabanPath('/orders'), icon: <ReceiptLongIcon />, permission: PERMISSION_POS },
  { label: 'Pagos', value: tejabanPath('/payments'), icon: <PaymentsIcon />, permission: PERMISSION_ADMIN },
  { label: 'Menú', value: tejabanPath('/menu'), icon: <RestaurantMenuIcon />, permission: PERMISSION_ADMIN },
];

export function DashboardLayout({ children }: { children?: React.ReactNode }) {
  const theme = useTheme();
  const isDesktopNav = useMediaQuery(desktopNavMediaQuery);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navItems = useMemo(
    () => filterNavByPermissions(ALL_NAV_ITEMS, user),
    [user],
  );

  const navValue = useMemo(() => {
    const rel = tejabanRelativePath(location.pathname);
    const match = navItems.find((item) => {
      const itemRel = tejabanRelativePath(item.value);
      return itemRel === '/' ? rel === '/' : rel.startsWith(itemRel);
    });
    return match?.value ?? false;
  }, [location.pathname, navItems]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', bgcolor: 'background.default' }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: 'primary.main',
          borderBottom: '3px solid',
          borderColor: 'secondary.main',
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 }, gap: 1 }}>
          <TejabanLogo height={44} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" noWrap sx={{ fontWeight: 800, lineHeight: 1.2, display: { xs: 'none', sm: 'block' } }}>
              {CONFIG.appName}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.85, display: { xs: 'none', md: 'block' } }}>
              {CONFIG.slogan}
            </Typography>
          </Box>

          {CONFIG.USE_MOCK_API && (
            <Chip
              label="MOCK"
              size="small"
              color="warning"
              sx={{ fontWeight: 700, display: { xs: 'none', md: 'flex' } }}
            />
          )}

          {user && (
            <Chip
              label={roleLabel(user)}
              size="small"
              variant="outlined"
              sx={{
                color: 'inherit',
                borderColor: 'rgba(255,255,255,0.5)',
                fontWeight: 600,
                display: { xs: 'none', sm: 'flex' },
              }}
            />
          )}

          <Typography variant="body2" sx={{ display: { xs: 'none', md: 'block' }, opacity: 0.9 }}>
            {displayName(user)}
          </Typography>

          <IconButton color="inherit" onClick={() => logout()} aria-label="Cerrar sesión">
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <Box
          component="main"
          sx={{
            flex: 1,
            overflow: 'auto',
            minWidth: 0,
            pb: isDesktopNav
              ? 2
              : { xs: 'calc(88px + env(safe-area-inset-bottom, 0px))', sm: 'calc(80px + env(safe-area-inset-bottom, 0px))' },
            px: { xs: 2, sm: 3 },
            py: { xs: 2, sm: 2.5 },
          }}
        >
          {children ?? <Outlet />}
        </Box>

        {isDesktopNav && navItems.length > 0 && (
          <Box
            component="nav"
            aria-label="Navegación principal"
            sx={{
              width: RAIL_WIDTH,
              flexShrink: 0,
              borderLeft: 1,
              borderColor: 'divider',
              bgcolor: 'background.paper',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              py: 1.5,
              gap: 0.25,
            }}
          >
            {navItems.map((item) => {
              const active = navValue === item.value;
              return (
                <Tooltip key={item.value} title={item.label} placement="left">
                  <IconButton
                    onClick={() => navigate(item.value)}
                    aria-label={item.label}
                    aria-current={active ? 'page' : undefined}
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 1.5,
                      color: active ? 'primary.main' : 'text.secondary',
                      bgcolor: active ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                      '&:hover': {
                        bgcolor: active
                          ? alpha(theme.palette.primary.main, 0.16)
                          : 'action.hover',
                      },
                    }}
                  >
                    {item.icon}
                  </IconButton>
                </Tooltip>
              );
            })}
          </Box>
        )}
      </Box>

      {!isDesktopNav && navItems.length > 0 && (
        <BottomNavigation
          value={navValue}
          onChange={(_, value) => navigate(value)}
          showLabels
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: theme.zIndex.appBar,
            borderTop: 1,
            borderColor: 'divider',
            height: { xs: 72, sm: 64 },
            pb: 'env(safe-area-inset-bottom)',
            bgcolor: 'background.paper',
          }}
        >
          {navItems.map((item) => (
            <BottomNavigationAction key={item.value} label={item.label} value={item.value} icon={item.icon} />
          ))}
        </BottomNavigation>
      )}
    </Box>
  );
}

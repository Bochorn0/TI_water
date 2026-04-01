import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Box, Tab, Tabs } from '@mui/material';
import { Header } from 'src/components/header';
import { useAuth } from 'src/auth/auth-context';
import {
  canManageTiwaterCatalog,
  canManageTiwaterQuotes,
  canManageUsersAndRoles,
} from 'src/auth/permissions';

function tabValue(pathname: string): string {
  if (pathname.startsWith('/admin/catalogo')) return 'catalogo';
  if (pathname.startsWith('/admin/cotizaciones')) return 'cotizaciones';
  if (pathname.startsWith('/admin/usuarios')) return 'usuarios';
  if (pathname.startsWith('/admin/roles')) return 'roles';
  if (pathname.startsWith('/admin/ajustes')) return 'ajustes';
  return 'catalogo';
}

export function AdminLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const showUsers = canManageUsersAndRoles(user);
  const showCatalog = canManageTiwaterCatalog(user);
  const showQuotes = canManageTiwaterQuotes(user);
  const current = tabValue(location.pathname);

  const handleTabChange = (_: React.SyntheticEvent, value: string) => {
    const paths: Record<string, string> = {
      catalogo: '/admin/catalogo',
      cotizaciones: '/admin/cotizaciones',
      usuarios: '/admin/usuarios',
      roles: '/admin/roles',
      ajustes: '/admin/ajustes',
    };
    const to = paths[value];
    if (to) navigate(to);
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'grey.50' }}>
      <Header />
      <Box
        component="main"
        sx={{
          flex: 1,
          mt: '100px',
          px: { xs: 1, sm: 2 },
          pb: 4,
          maxWidth: 1200,
          mx: 'auto',
          width: '100%',
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper', borderRadius: 1, px: 1, mb: 2 }}>
          <Tabs
            value={current}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            aria-label="Herramientas de administración"
          >
            {showCatalog && <Tab label="Catálogo" value="catalogo" id="admin-tab-catalogo" />}
            {showQuotes && <Tab label="Cotizaciones" value="cotizaciones" id="admin-tab-cotizaciones" />}
            {showUsers && <Tab label="Usuarios" value="usuarios" id="admin-tab-usuarios" />}
            {showUsers && <Tab label="Roles" value="roles" id="admin-tab-roles" />}
            <Tab label="Cuenta" value="ajustes" id="admin-tab-ajustes" />
          </Tabs>
        </Box>
        <Outlet />
      </Box>
    </Box>
  );
}

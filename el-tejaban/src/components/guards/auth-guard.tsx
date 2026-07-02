import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import { useAuth } from '@tejaban/auth/auth-context';
import { roleLabel } from '@tejaban/auth/permissions';
import type { PermissionPath } from '@tejaban/types/auth.types';
import { PERMISSION_POS } from '@tejaban/types/auth.types';
import { tejabanPath } from '@tejaban/paths';

const HOME = tejabanPath('/');

function AuthSpinner() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60dvh' }}>
      <CircularProgress />
    </Box>
  );
}

export function AuthGuard() {
  const { isAuthenticated, isBootstrapping } = useAuth();
  const location = useLocation();

  if (isBootstrapping) return <AuthSpinner />;

  if (!isAuthenticated) {
    return <Navigate to="login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

export function GuestGuard() {
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) return <AuthSpinner />;

  if (isAuthenticated) {
    return <Navigate to=".." replace relative="path" />;
  }

  return <Outlet />;
}

export function PermissionGuard({ permission, children }: { permission: PermissionPath; children: React.ReactNode }) {
  const { hasPermission, user } = useAuth();

  if (!hasPermission(permission)) {
    return (
      <Box sx={{ textAlign: 'center', py: 8, px: 2 }}>
        <LockIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Sin acceso
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Tu rol ({roleLabel(user)}) no tiene permiso para esta sección.
        </Typography>
        <Button variant="contained" href={HOME}>
          Ir al inicio
        </Button>
      </Box>
    );
  }

  return <>{children}</>;
}

export function RoutePermissionGuard() {
  const { canAccessRoute, hasPermission, user, logout } = useAuth();
  const location = useLocation();

  if (!canAccessRoute(location.pathname)) {
    if (!hasPermission(PERMISSION_POS)) {
      return (
        <Box sx={{ textAlign: 'center', py: 8, px: 2 }}>
          <LockIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Sin acceso a El Tejaban
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            La cuenta {user?.email ?? 'actual'} ({roleLabel(user)}) no tiene permiso para este módulo.
          </Typography>
          <Button
            variant="contained"
            onClick={async () => {
              await logout();
              window.location.assign(tejabanPath('/login'));
            }}
          >
            Usar otra cuenta
          </Button>
        </Box>
      );
    }

    return <Navigate to="../pos" replace relative="path" />;
  }

  return <Outlet />;
}

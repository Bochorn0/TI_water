import { lazy, Suspense } from 'react';
import { Navigate, Route, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import {
  AuthGuard,
  GuestGuard,
  PermissionGuard,
  RoutePermissionGuard,
} from '@tejaban/components/guards/auth-guard';
import { DashboardLayout } from '@tejaban/layouts/dashboard-layout';
import { useAuth } from '@tejaban/auth/auth-context';
import { tejabanPath } from '@tejaban/paths';
import { PERMISSION_ADMIN } from '@tejaban/types/auth.types';

const LoginPage = lazy(() => import('@tejaban/pages/login'));
const DashboardPage = lazy(() => import('@tejaban/pages/dashboard'));
const PosPage = lazy(() => import('@tejaban/pages/pos'));
const OrdersListPage = lazy(() => import('@tejaban/pages/orders/orders-list'));
const OrderDetailPage = lazy(() => import('@tejaban/pages/orders/order-detail'));
const PaymentsPage = lazy(() => import('@tejaban/pages/payments/payments-list'));
const MenuAdminPage = lazy(() => import('@tejaban/pages/menu-admin'));

function PageLoader() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 240 }}>
      <CircularProgress />
    </Box>
  );
}

function withSuspense(element: React.ReactNode) {
  return <Suspense fallback={<PageLoader />}>{element}</Suspense>;
}

/** Explicit home handler — avoids splat/index redirect loops on /el-tejaban/ */
function TejabanHome() {
  const { isAuthenticated, isBootstrapping, canAccessRoute } = useAuth();
  const location = useLocation();

  if (isBootstrapping) return <PageLoader />;

  if (!isAuthenticated) {
    return <Navigate to="login" replace />;
  }

  if (!canAccessRoute(location.pathname)) {
    return <Navigate to="pos" replace />;
  }

  return (
    <DashboardLayout>
      {withSuspense(<DashboardPage />)}
    </DashboardLayout>
  );
}

function TejabanUnknown() {
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="login" replace />;
  return <Navigate to={tejabanPath('/')} replace />;
}

/** Child routes mounted under <Route path="/el-tejaban" element={<TejabanShell />}> */
export function TejabanRouteChildren() {
  return (
    <>
      <Route index element={<TejabanHome />} />

      <Route element={<GuestGuard />}>
        <Route path="login" element={withSuspense(<LoginPage />)} />
      </Route>

      <Route element={<AuthGuard />}>
        <Route element={<DashboardLayout />}>
          <Route element={<RoutePermissionGuard />}>
            <Route path="pos" element={withSuspense(<PosPage />)} />
            <Route path="orders" element={withSuspense(<OrdersListPage />)} />
            <Route path="orders/:id" element={withSuspense(<OrderDetailPage />)} />
            <Route
              path="payments"
              element={
                <PermissionGuard permission={PERMISSION_ADMIN}>
                  {withSuspense(<PaymentsPage />)}
                </PermissionGuard>
              }
            />
            <Route
              path="menu"
              element={
                <PermissionGuard permission={PERMISSION_ADMIN}>
                  {withSuspense(<MenuAdminPage />)}
                </PermissionGuard>
              }
            />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<TejabanUnknown />} />
    </>
  );
}

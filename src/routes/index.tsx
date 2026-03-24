import { Routes, Route } from 'react-router-dom';
import { HomePage } from 'src/pages/home';
import { AboutPage } from 'src/pages/about';
import { PurificadoresPage } from 'src/pages/purificadores';
import { ContactPage } from 'src/pages/contact';
import { CotizacionesPage } from 'src/pages/quotes';
import { LoginPage } from 'src/pages/auth/login-page';
import { TiwaterCatalogAdminPage } from 'src/pages/admin/tiwater-catalog-page';
import { TiwaterCatalogProductAdminPage } from 'src/pages/admin/tiwater-catalog-product-page';
import { AdminUsersPage } from 'src/pages/admin/admin-users-page';
import { AdminRolesPage } from 'src/pages/admin/admin-roles-page';
import { AdminSettingsPage } from 'src/pages/admin/admin-settings-page';
import { ProtectedAdminRoute } from 'src/components/auth/protected-route';
import { AdminLayout } from 'src/components/admin/admin-layout';
import { AdminIndexRedirect } from 'src/components/admin/admin-index-redirect';
import { CatalogRouteGuard } from 'src/components/admin/catalog-route-guard';
import { UsersRouteGuard } from 'src/components/admin/users-route-guard';

export function Router() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/purificadores" element={<PurificadoresPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/cotizaciones" element={<CotizacionesPage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/admin"
        element={
          <ProtectedAdminRoute>
            <AdminLayout />
          </ProtectedAdminRoute>
        }
      >
        <Route index element={<AdminIndexRedirect />} />
        <Route
          path="catalogo"
          element={
            <CatalogRouteGuard>
              <TiwaterCatalogAdminPage />
            </CatalogRouteGuard>
          }
        />
        <Route
          path="catalogo/:id"
          element={
            <CatalogRouteGuard>
              <TiwaterCatalogProductAdminPage />
            </CatalogRouteGuard>
          }
        />
        <Route
          path="usuarios"
          element={
            <UsersRouteGuard>
              <AdminUsersPage />
            </UsersRouteGuard>
          }
        />
        <Route
          path="roles"
          element={
            <UsersRouteGuard>
              <AdminRolesPage />
            </UsersRouteGuard>
          }
        />
        <Route path="ajustes" element={<AdminSettingsPage />} />
      </Route>
    </Routes>
  );
}

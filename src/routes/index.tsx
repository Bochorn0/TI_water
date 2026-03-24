import { Routes, Route } from 'react-router-dom';
import { HomePage } from 'src/pages/home';
import { AboutPage } from 'src/pages/about';
import { PurificadoresPage } from 'src/pages/purificadores';
import { ContactPage } from 'src/pages/contact';
import { CotizacionesPage } from 'src/pages/quotes';
import { LoginPage } from 'src/pages/auth/login-page';
import { TiwaterCatalogAdminPage } from 'src/pages/admin/tiwater-catalog-page';
import { TiwaterCatalogProductAdminPage } from 'src/pages/admin/tiwater-catalog-product-page';
import { ProtectedRoute } from 'src/components/auth/protected-route';

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
        path="/admin/catalogo"
        element={
          <ProtectedRoute>
            <TiwaterCatalogAdminPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/catalogo/nuevo"
        element={
          <ProtectedRoute>
            <TiwaterCatalogProductAdminPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/catalogo/:id"
        element={
          <ProtectedRoute>
            <TiwaterCatalogProductAdminPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

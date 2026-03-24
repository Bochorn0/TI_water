import { Navigate } from 'react-router-dom';
import { useAuth } from 'src/auth/auth-context';
import { canManageTiwaterCatalog } from 'src/auth/permissions';

export function CatalogRouteGuard({ children }: { children: React.ReactElement }) {
  const { user } = useAuth();
  if (!canManageTiwaterCatalog(user)) {
    return <Navigate to="/admin/ajustes" replace />;
  }
  return children;
}

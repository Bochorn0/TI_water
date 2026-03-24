import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from 'src/auth/auth-context';
import { canManageTiwaterCatalog } from 'src/auth/permissions';

export function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const { user, token } = useAuth();
  const location = useLocation();

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (!canManageTiwaterCatalog(user)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

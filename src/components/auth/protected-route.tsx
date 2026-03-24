import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from 'src/auth/auth-context';

/** Login required. Tabs inside /admin hide sections by permission; /admin/ajustes is for any logged-in user. */
export function ProtectedAdminRoute({ children }: { children: React.ReactElement }) {
  const { user, token } = useAuth();
  const location = useLocation();

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}

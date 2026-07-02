import { Navigate } from 'react-router-dom';
import { useAuth } from 'src/auth/auth-context';
import { canManageSecretLinks } from 'src/auth/permissions';

export function SecretLinksRouteGuard({ children }: { children: React.ReactElement }) {
  const { user } = useAuth();
  if (!canManageSecretLinks(user)) {
    return <Navigate to="/admin/ajustes" replace />;
  }
  return children;
}

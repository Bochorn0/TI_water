import { Navigate } from 'react-router-dom';
import { useAuth } from 'src/auth/auth-context';
import { canManageUsersAndRoles } from 'src/auth/permissions';

export function UsersRouteGuard({ children }: { children: React.ReactElement }) {
  const { user } = useAuth();
  if (!canManageUsersAndRoles(user)) {
    return <Navigate to="/admin/ajustes" replace />;
  }
  return children;
}

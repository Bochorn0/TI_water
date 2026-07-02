import { Navigate } from 'react-router-dom';
import { useAuth } from 'src/auth/auth-context';
import { canManageTiwaterQuotes } from 'src/auth/permissions';

export function QuotesRouteGuard({ children }: { children: React.ReactElement }) {
  const { user } = useAuth();
  if (!canManageTiwaterQuotes(user)) {
    return <Navigate to="/admin/ajustes" replace />;
  }
  return children;
}

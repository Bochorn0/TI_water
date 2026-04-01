import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'src/auth/auth-context';
import {
  canManageTiwaterCatalog,
  canManageTiwaterQuotes,
  canManageUsersAndRoles,
} from 'src/auth/permissions';

/** Default first tab when visiting /admin */
export function AdminIndexRedirect() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (canManageTiwaterQuotes(user)) {
      navigate('/admin/cotizaciones', { replace: true });
    } else if (canManageTiwaterCatalog(user)) {
      navigate('/admin/catalogo', { replace: true });
    } else if (canManageUsersAndRoles(user)) {
      navigate('/admin/usuarios', { replace: true });
    } else {
      navigate('/admin/ajustes', { replace: true });
    }
  }, [user, navigate]);

  return null;
}

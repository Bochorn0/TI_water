import type { AuthUser } from './auth-types';

/** Catalog CRUD in API requires role admin or permission /tiwater-catalog (after migration 021). */
export function canManageTiwaterCatalog(user: AuthUser | null): boolean {
  if (!user?.role) return false;
  const name = user.role.name?.toLowerCase();
  if (name === 'admin') return true;
  const perms = (user.role.permissions || []).map((p) => String(p).toLowerCase());
  return perms.includes('/tiwater-catalog');
}

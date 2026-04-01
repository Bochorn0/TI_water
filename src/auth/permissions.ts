import type { AuthUser } from './auth-types';

function permSet(user: AuthUser | null): Set<string> {
  if (!user?.role?.permissions) return new Set();
  return new Set((user.role.permissions || []).map((p) => String(p).toLowerCase()));
}

function isAdmin(user: AuthUser | null): boolean {
  return user?.role?.name?.toLowerCase() === 'admin';
}

/** Catalog CRUD in API requires role admin or permission /tiwater-catalog (after migration 021). */
export function canManageTiwaterCatalog(user: AuthUser | null): boolean {
  if (!user?.role) return false;
  if (isAdmin(user)) return true;
  return permSet(user).has('/tiwater-catalog');
}

/** Users & roles API routes require /usuarios (admin role includes it in seeded permissions). */
export function canManageUsersAndRoles(user: AuthUser | null): boolean {
  if (!user?.role) return false;
  if (isAdmin(user)) return true;
  return permSet(user).has('/usuarios');
}

export function canManageTiwaterQuotes(user: AuthUser | null): boolean {
  if (!user?.role) return false;
  if (isAdmin(user)) return true;
  const perms = permSet(user);
  return perms.has('/tiwater-quotes') || perms.has('/tiwater-catalog');
}


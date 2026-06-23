import type { PermissionPath, TiWaterAuthUser } from '@tejaban/types/auth.types';
import { PERMISSION_ADMIN, PERMISSION_POS } from '@tejaban/types/auth.types';
import { tejabanRelativePath } from '@tejaban/paths';

function permSet(user: TiWaterAuthUser | null): Set<string> {
  if (!user?.role?.permissions) return new Set();
  return new Set(user.role.permissions.map((p) => p.toLowerCase()));
}

export function isAdmin(user: TiWaterAuthUser | null): boolean {
  return user?.role?.name?.toLowerCase() === 'admin';
}

export function hasPermission(user: TiWaterAuthUser | null, path: PermissionPath): boolean {
  if (!user?.role) return false;
  if (isAdmin(user)) return true;
  return permSet(user).has(path.toLowerCase());
}

export function canAccessElTejaban(user: TiWaterAuthUser | null): boolean {
  return hasPermission(user, PERMISSION_POS);
}

export function canManageElTejabanAdmin(user: TiWaterAuthUser | null): boolean {
  return hasPermission(user, PERMISSION_ADMIN);
}

export function filterNavByPermissions<T extends { permission: PermissionPath }>(
  items: T[],
  user: TiWaterAuthUser | null,
): T[] {
  return items.filter((item) => hasPermission(user, item.permission));
}

export const ROUTE_PERMISSIONS: Record<string, PermissionPath> = {
  '/': PERMISSION_POS,
  '/pos': PERMISSION_POS,
  '/orders': PERMISSION_POS,
  '/payments': PERMISSION_ADMIN,
  '/menu': PERMISSION_ADMIN,
};

export function getRoutePermission(pathname: string): PermissionPath | null {
  const path = tejabanRelativePath(pathname);
  if (path === '/') return PERMISSION_POS;
  if (path.startsWith('/orders') || path.startsWith('/pos')) return PERMISSION_POS;
  if (path.startsWith('/payments') || path.startsWith('/menu')) return PERMISSION_ADMIN;
  return null;
}

export function canAccessRoute(user: TiWaterAuthUser | null, pathname: string): boolean {
  const perm = getRoutePermission(pathname);
  if (!perm) return true;
  return hasPermission(user, perm);
}

export function displayName(user: TiWaterAuthUser | null): string {
  return user?.nombre || user?.email || 'Usuario';
}

export function roleLabel(user: TiWaterAuthUser | null): string {
  if (!user?.role) return '—';
  const name = user.role.name.toLowerCase();
  if (name === 'admin') return 'Administrador';
  if (name === 'mesero') return 'Mesero';
  return user.role.name;
}

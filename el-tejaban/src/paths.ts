import { CONFIG } from '@tejaban/config-global';

const BASE = CONFIG.APP_BASE;

/** Full app path, e.g. tejabanPath('/pos') → '/el-tejaban/pos' */
export function tejabanPath(subpath = '/'): string {
  if (subpath === '/' || subpath === '') return `${BASE}/`;
  const p = subpath.startsWith('/') ? subpath : `/${subpath}`;
  return `${BASE}${p}`;
}

/** Strip /el-tejaban prefix for route permission checks */
export function tejabanRelativePath(pathname: string): string {
  if (!pathname.startsWith(BASE)) return pathname;
  const rest = pathname.slice(BASE.length) || '/';
  return rest.startsWith('/') ? rest : `/${rest}`;
}

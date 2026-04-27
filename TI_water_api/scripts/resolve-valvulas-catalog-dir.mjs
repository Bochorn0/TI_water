import { existsSync, readdirSync } from 'fs';
import { join } from 'path';

/**
 * Valvulas product.json root: .../valvulas/<CODE>/product.json
 *
 * Priority:
 * 1. CATALOG_VALVULAS_DIR (override)
 * 2. TI_water_api/catalog-seed/valvulas (shipped with API deploy)
 * 3. TI_water/src/assets/catalogs/valvulas (monorepo dev)
 */
export function resolveValvulasCatalogDir(scriptDir) {
  if (process.env.CATALOG_VALVULAS_DIR) {
    const v = process.env.CATALOG_VALVULAS_DIR;
    if (!hasAnyProductJson(v)) {
      throw new Error(`CATALOG_VALVULAS_DIR has no product.json folders: ${v}`);
    }
    return v;
  }

  const apiRoot = join(scriptDir, '..');
  const seed = join(apiRoot, 'catalog-seed/valvulas');
  const monorepo = join(apiRoot, '..', 'src', 'assets', 'catalogs', 'valvulas');

  if (hasAnyProductJson(seed)) return seed;
  if (hasAnyProductJson(monorepo)) return monorepo;

  throw new Error(
    `No valvulas catalog found. Expected ${seed} or ${monorepo}, or set CATALOG_VALVULAS_DIR. ` +
      `From dev machine run: node scripts/sync-catalog-seed-from-tiwater.mjs`,
  );
}

function hasAnyProductJson(dir) {
  if (!existsSync(dir)) return false;
  for (const n of readdirSync(dir, { withFileTypes: true })) {
    if (!n.isDirectory() || n.name.startsWith('.')) continue;
    if (n.name === 'BATCH-MANIFEST.json' || n.name === 'BATCH-MANIFEST') continue;
    if (existsSync(join(dir, n.name, 'product.json'))) return true;
  }
  return false;
}

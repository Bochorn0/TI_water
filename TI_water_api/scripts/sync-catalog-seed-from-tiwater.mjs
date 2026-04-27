#!/usr/bin/env node
/**
 * Copy each valvulas folder's product.json from TI_water/src/assets into
 * TI_water_api/catalog-seed/valvulas (optional BATCH-MANIFEST.json if present).
 *
 * Run from repo: cd TI_water/TI_water_api && node scripts/sync-catalog-seed-from-tiwater.mjs
 */
import { cpSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __d = dirname(fileURLToPath(import.meta.url));
const apiRoot = join(__d, '..');
const tiWaterRoot = join(apiRoot, '..');
const srcValvulas = join(tiWaterRoot, 'src/assets/catalogs/valvulas');
const destRoot = join(apiRoot, 'catalog-seed/valvulas');

if (!existsSync(srcValvulas)) {
  console.error('[sync] Missing source:', srcValvulas);
  process.exit(1);
}

mkdirSync(destRoot, { recursive: true });

let n = 0;
for (const entry of readdirSync(srcValvulas, { withFileTypes: true })) {
  if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
  const pj = join(srcValvulas, entry.name, 'product.json');
  if (!existsSync(pj)) continue;
  const destDir = join(destRoot, entry.name);
  mkdirSync(destDir, { recursive: true });
  cpSync(pj, join(destDir, 'product.json'));
  n += 1;
}

const man = join(srcValvulas, 'BATCH-MANIFEST.json');
if (existsSync(man)) {
  cpSync(man, join(destRoot, 'BATCH-MANIFEST.json'));
}

if (n === 0) {
  console.error('[sync] No product.json under', srcValvulas);
  process.exit(1);
}

console.log('[sync] Wrote', n, 'product.json trees to', destRoot);

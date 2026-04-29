#!/usr/bin/env node
/**
 * Import each valvulas folder's product.json (sorted by productKey for stable order).
 * From TI_water_api: node scripts/import-all-valvulas-json.mjs
 */
import 'dotenv/config';
import { readdirSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import TIWaterProductModel from '../src/models/postgres/tiwater-product.model.js';
import { buildPayload, resolveProductKey } from './import-catalog-helpers.mjs';
import { resolveValvulasCatalogDir } from './resolve-valvulas-catalog-dir.mjs';

const __d = dirname(fileURLToPath(import.meta.url));

function collectProductJsons() {
  let V;
  try {
    V = resolveValvulasCatalogDir(__d);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
  const paths = [];
  for (const name of readdirSync(V, { withFileTypes: true })) {
    if (!name.isDirectory() || name.name.startsWith('.')) continue;
    if (name.name === 'BATCH-MANIFEST.json' || name.name === 'BATCH-MANIFEST') continue;
    const p = join(V, name.name, 'product.json');
    if (existsSync(p)) paths.push(p);
  }
  return paths.sort();
}

async function importFile(filePath) {
  const data = JSON.parse(readFileSync(filePath, 'utf8'));
  const p = data.product;
  if (!p?.code || !p?.name) {
    console.warn('[skip]', filePath, 'invalid');
    return;
  }
  const payload = buildPayload(data);
  const productKey = resolveProductKey(data);

  const byKey = await TIWaterProductModel.findByProductKey(productKey);
  if (byKey) {
    await TIWaterProductModel.updateById(byKey.id, payload);
    console.log('updated', productKey, p.code, filePath);
    return;
  }
  const byCode = await TIWaterProductModel.findByCode(p.code);
  if (byCode) {
    await TIWaterProductModel.updateById(byCode.id, payload);
    console.log('updated by code', p.code, productKey, filePath);
    return;
  }
  const created = await TIWaterProductModel.create(payload);
  console.log('created', productKey, p.code, 'id', created?.id, filePath);
}

async function main() {
  const paths = collectProductJsons();
  console.log('Importing', paths.length, 'JSON files...');
  const seenCodes = new Set();
  for (const f of paths) {
    try {
      const data = JSON.parse(readFileSync(f, 'utf8'));
      const code = String(data?.product?.code || '').trim().toUpperCase();
      if (code && seenCodes.has(code)) {
        console.warn('[skip] duplicate code', code, f);
        continue;
      }
      if (code) seenCodes.add(code);
      await importFile(f);
    } catch (e) {
      console.error('FAIL', f, e.message);
    }
  }
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

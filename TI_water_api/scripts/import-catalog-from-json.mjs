#!/usr/bin/env node
/**
 * Import catalog product JSON into tiwater_products.
 * productKey: TIW + 3-letter type + 3 digits (e.g. TIWVAL001). Images: /catalogs/products/{key}_main.png
 */
import 'dotenv/config';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import TIWaterProductModel from '../src/models/postgres/tiwater-product.model.js';
import { buildPayload, resolveProductKey } from './import-catalog-helpers.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultJson = path.join(__dirname, '../../src/assets/catalogs/valvulas/AQT-56/product.json');
const jsonPath = process.argv[2] || defaultJson;

async function main() {
  if (!existsSync(jsonPath)) {
    console.error('[import] JSON not found:', jsonPath);
    process.exit(1);
  }
  const data = JSON.parse(readFileSync(jsonPath, 'utf8'));
  const p = data.product;
  if (!p?.code || !p?.name) {
    console.error('[import] product.code and product.name are required');
    process.exit(1);
  }

  const payload = buildPayload(data);
  const productKey = resolveProductKey(data);

  const byKey = await TIWaterProductModel.findByProductKey(productKey);
  if (byKey) {
    const updated = await TIWaterProductModel.updateById(byKey.id, payload);
    console.log('[import] updated by productKey', productKey, 'id', updated?.id);
    return;
  }
  const byCode = await TIWaterProductModel.findByCode(p.code);
  if (byCode) {
    const updated = await TIWaterProductModel.updateById(byCode.id, payload);
    console.log('[import] updated by code', p.code, 'productKey', productKey, 'id', updated?.id);
    return;
  }
  const created = await TIWaterProductModel.create(payload);
  console.log('[import] created', productKey, p.code, 'id', created?.id);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

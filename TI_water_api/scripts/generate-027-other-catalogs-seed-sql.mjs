#!/usr/bin/env node
/**
 * Generate scripts/migrations/027_seed_tiwater_other_catalogs.sql from:
 *  TI_water/src/assets/catalogs/{plomeria,presurizadores,sumergibles,general}/<code>/product.json
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { buildPayload } from './import-catalog-helpers.mjs';

const __d = dirname(fileURLToPath(import.meta.url));
const apiRoot = join(__d, '..');
const tiWaterRoot = join(apiRoot, '..');
const catalogsRoot = join(tiWaterRoot, 'src/assets/catalogs');
const outFile = join(apiRoot, 'scripts/migrations/027_seed_tiwater_other_catalogs.sql');

const CATALOG_SLUGS = ['plomeria', 'presurizadores', 'sumergibles', 'general'];

/** Delimited string for SQL: $tag$...$tag$ — tag extended if payload contains delimiter. */
function dollarSql(payload, tagBase) {
  let tag = String(tagBase).replace(/[^a-zA-Z0-9_]/g, '_') || 't';
  for (;;) {
    const d = '$' + tag + '$';
    if (!payload.includes(d)) return d + payload + d;
    tag += 'x';
  }
}

function toTextSql(s, tagBase) {
  if (s == null) return 'NULL';
  return dollarSql(String(s), tagBase);
}

function toJsonbSql(obj, tagBase) {
  const j = JSON.stringify(obj);
  return dollarSql(j, tagBase) + '::jsonb';
}

function collectJsonPaths() {
  const paths = [];
  for (const slug of CATALOG_SLUGS) {
    const base = join(catalogsRoot, slug);
    if (!existsSync(base)) continue;
    for (const entry of readdirSync(base, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
      const p = join(base, entry.name, 'product.json');
      if (existsSync(p)) paths.push(p);
    }
  }
  return paths.sort();
}

const jsonPaths = collectJsonPaths();
if (jsonPaths.length === 0) {
  console.error('No product.json found in non-valvulas catalogs under', catalogsRoot);
  process.exit(1);
}

const rows = [];
const seenCodes = new Set();
let idx = 0;
for (const p of jsonPaths) {
  const data = JSON.parse(readFileSync(p, 'utf8'));
  const pl = buildPayload(data);
  const codeKey = String(pl.code || '').trim().toUpperCase();
  if (!codeKey) {
    console.warn('[skip] missing code in', p);
    continue;
  }
  if (seenCodes.has(codeKey)) {
    console.warn('[skip] duplicate code', codeKey, 'from', p);
    continue;
  }
  seenCodes.add(codeKey);
  const t = `v027_${idx}`;
  rows.push({
    product_key: toTextSql(pl.productKey, `${t}_pk`),
    code: toTextSql(pl.code, `${t}_code`),
    name: toTextSql(pl.name, `${t}_name`),
    description: toTextSql(pl.description, `${t}_desc`),
    category: toTextSql(pl.category, `${t}_cat`),
    price: pl.price == null ? 'NULL' : Number(pl.price),
    specifications: toJsonbSql(pl.specifications, `${t}_spec`),
    images: toJsonbSql(pl.images, `${t}_img`),
    catalog_source: toTextSql(pl.catalogSource, `${t}_src`),
    page_number: pl.pageNumber == null ? 'NULL' : String(parseInt(pl.pageNumber, 10)),
    is_active: pl.isActive === false ? 'false' : 'true',
  });
  idx += 1;
}

if (rows.length === 0) {
  console.error('No valid rows generated from', jsonPaths.length, 'files');
  process.exit(1);
}

const valuesSql = rows
  .map(
    (r) => `  (${r.product_key}, ${r.code}, ${r.name}, ${r.description}, ${r.category}, ${r.price},
   ${r.specifications}, ${r.images}, ${r.catalog_source}, ${r.page_number}, ${r.is_active})`,
  )
  .join(',\n');

const sql = `-- Seed non-valvulas catalog products (plomeria/presurizadores/sumergibles/general).
-- Regenerate: node scripts/generate-027-other-catalogs-seed-sql.mjs
-- Idempotent upsert by unique "code".

INSERT INTO tiwater_products (
  product_key, code, name, description, category, price,
  specifications, images, catalog_source, page_number, is_active
) VALUES
${valuesSql}
ON CONFLICT (code) DO UPDATE SET
  product_key = EXCLUDED.product_key,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  specifications = EXCLUDED.specifications,
  images = EXCLUDED.images,
  catalog_source = EXCLUDED.catalog_source,
  page_number = EXCLUDED.page_number,
  is_active = EXCLUDED.is_active,
  updated_at = CURRENT_TIMESTAMP;

DO $$
BEGIN
  RAISE NOTICE '✅ 027_seed_tiwater_other_catalogs: % rows upserted', ${rows.length};
END $$;
`;

writeFileSync(outFile, sql, 'utf8');
console.log('Wrote', outFile, 'rows=', rows.length);

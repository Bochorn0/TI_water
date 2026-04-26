#!/usr/bin/env node
/**
 * Print next TIW* product key for a catalog type, based on max existing sequence in DB.
 * Usage: node scripts/next-catalog-product-key.mjs VAL
 *        node scripts/next-catalog-product-key.mjs PLO
 */
import 'dotenv/config';
import { query } from '../src/config/postgres-tiwater.config.js';
import { formatProductKey } from '../src/utils/catalog-product-key.js';

const typeShort = (process.argv[2] || 'VAL').toUpperCase().replace(/[^A-Z]/g, '').padEnd(3, 'X').slice(0, 3);
const pattern = `TIW${typeShort}`;

const r = await query(
  `SELECT product_key FROM tiwater_products
   WHERE product_key IS NOT NULL AND product_key LIKE $1`,
  [`${pattern}%`],
);
let maxN = 0;
for (const row of r.rows) {
  const m = String(row.product_key).match(new RegExp(`^${pattern}(\\d{3})$`));
  if (m) {
    const n = parseInt(m[1], 10);
    if (n > maxN) maxN = n;
  }
}
const next = maxN + 1;
if (next > 999) {
  console.error('Sequence overflow > 999 for type', typeShort);
  process.exit(1);
}
console.log(formatProductKey(typeShort, next));

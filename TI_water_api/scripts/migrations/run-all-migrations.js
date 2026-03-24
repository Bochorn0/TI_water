#!/usr/bin/env node
/**
 * Run all TI_water_api migrations in order against POSTGRES_* (single DB).
 * Use with POSTGRES_SSL=true for Azure. Requires network path from runner to server.
 *
 * Usage (from TI_water_api): node scripts/migrations/run-all-migrations.js
 */

import 'dotenv/config';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pkg from 'pg';

const { Client } = pkg;
const __dirname = dirname(fileURLToPath(import.meta.url));
const API_DIR = join(__dirname, '../..');

const MIGRATIONS = [
  'scripts/migrations/007_create_clients_table.sql',
  'scripts/migrations/018_create_roles_table.sql',
  'scripts/migrations/019_create_users_table.sql',
  'scripts/migrations/020_seed_roles_and_admin_user.sql',
  'scripts/migrations/004_create_tiwater_products_table.sql',
  'scripts/migrations/005_create_tiwater_quotes_table.sql',
];

async function main() {
  const client = new Client({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT
      ? parseInt(process.env.POSTGRES_PORT, 10)
      : 5432,
    database: process.env.POSTGRES_DB || 'postgres',
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  await client.connect();
  try {
    for (const rel of MIGRATIONS) {
      const fullPath = join(API_DIR, rel);
      const sql = readFileSync(fullPath, 'utf8');
      console.log('Running:', rel);
      await client.query(sql);
    }
    console.log('\n✅ All migrations finished.');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

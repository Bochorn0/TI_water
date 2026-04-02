#!/usr/bin/env node
/**
 * Ordered migrations with a tiwater_migrations ledger (name + executed_at).
 * Each file runs in a transaction; on success a row is inserted. Already-recorded
 * names are skipped. Uses pg_advisory_lock so concurrent app instances do not
 * race on the same migration.
 *
 * Env: POSTGRES_* (POSTGRES_SSL=true for Azure).
 * Usage (from TI_water_api): node scripts/migrations/run-all-migrations.js
 */

import 'dotenv/config';
import { readFileSync } from 'fs';
import { basename, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';

const { Client } = pkg;
const __dirname = dirname(fileURLToPath(import.meta.url));
const API_DIR = join(__dirname, '../..');

/** Advisory lock key (arbitrary); serializes migration runs across instances */
const MIGRATION_LOCK_KEY = 0x74697761; // "tiwa"

const MIGRATIONS = [
  'scripts/migrations/007_create_clients_table.sql',
  'scripts/migrations/018_create_roles_table.sql',
  'scripts/migrations/019_create_users_table.sql',
  'scripts/migrations/020_seed_roles_and_admin_user.sql',
  'scripts/migrations/004_create_tiwater_products_table.sql',
  'scripts/migrations/005_create_tiwater_quotes_table.sql',
  'scripts/migrations/021_add_tiwater_catalog_permission.sql',
  'scripts/migrations/022_seed_admin_tiwater_user.sql',
  'scripts/migrations/023_quote_items_manual_lines.sql',
];

const ENSURE_LEDGER_SQL = `
CREATE TABLE IF NOT EXISTS tiwater_migrations (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tiwater_migrations_executed_at ON tiwater_migrations (executed_at DESC);
`;

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

  try {
    await client.connect();
    await client.query(ENSURE_LEDGER_SQL);

    await client.query('SELECT pg_advisory_lock($1)', [MIGRATION_LOCK_KEY]);
    try {
      for (const rel of MIGRATIONS) {
        const name = basename(rel);
        const { rowCount } = await client.query(
          'SELECT 1 FROM tiwater_migrations WHERE name = $1',
          [name],
        );
        if (rowCount > 0) {
          console.log('[skip] already applied:', name);
          continue;
        }

        const fullPath = join(API_DIR, rel);
        const sql = readFileSync(fullPath, 'utf8');
        console.log('[run]', name);

        try {
          await client.query('BEGIN');
          await client.query(sql);
          await client.query(
            'INSERT INTO tiwater_migrations (name) VALUES ($1)',
            [name],
          );
          await client.query('COMMIT');
          console.log('[ok]', name);
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        }
      }
      console.log('\n✅ Migrations finished (pending runs applied; rest skipped).');
    } finally {
      await client.query('SELECT pg_advisory_unlock($1)', [MIGRATION_LOCK_KEY]);
    }
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

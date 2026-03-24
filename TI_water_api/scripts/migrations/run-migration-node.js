#!/usr/bin/env node
/**
 * Run one PostgreSQL migration with pg (SSL for Azure).
 * Usage: from TI_water_api root: node scripts/migrations/run-migration-node.js <path-to.sql>
 */

import 'dotenv/config';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pkg from 'pg';

const { Client } = pkg;
const __dirname = dirname(fileURLToPath(import.meta.url));
const API_DIR = join(__dirname, '../..');

async function runMigration(migrationFile) {
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
    const sql = readFileSync(migrationFile, 'utf8');
    await client.connect();
    await client.query(sql);
    console.log('\n✅ Migration completed:', migrationFile);
  } catch (err) {
    console.error('\n❌ Migration failed:', migrationFile, err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

const arg = process.argv[2];
if (!arg) {
  console.error('Usage: node scripts/migrations/run-migration-node.js <migration_file.sql>');
  process.exit(1);
}

const fullPath = arg.startsWith('/') ? arg : join(API_DIR, arg);
runMigration(fullPath);

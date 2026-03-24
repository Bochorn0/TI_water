import 'dotenv/config';
import pkg from 'pg';

const { Pool } = pkg;

const isAzure = process.env.POSTGRES_SSL === 'true';
const defaultTiwaterDb = isAzure ? 'postgres' : 'ti_water';
// Prefer explicit POSTGRES_TIWATER_DB; else same DB as main pool (single Azure DB is typical)
const tiwaterDb =
  process.env.POSTGRES_TIWATER_DB || process.env.POSTGRES_DB || defaultTiwaterDb;

const pgHost =
  process.env.POSTGRES_TIWATER_HOST || process.env.POSTGRES_HOST || 'localhost';

// Azure App Service sets WEBSITE_SITE_NAME; missing POSTGRES_* → ECONNREFUSED 127.0.0.1:5432
if (
  process.env.WEBSITE_SITE_NAME &&
  (pgHost === 'localhost' || pgHost === '127.0.0.1')
) {
  console.error(
    '[PostgreSQL TI_water] Host is localhost on App Service. Add Application settings: POSTGRES_HOST=tiwatermx-api-server.postgres.database.azure.com, POSTGRES_SSL=true, POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD, and POSTGRES_TIWATER_DB (same DB if one database).'
  );
}

const pool = new Pool({
  host: pgHost,
  port: parseInt(process.env.POSTGRES_TIWATER_PORT || process.env.POSTGRES_PORT || '5432', 10),
  database: tiwaterDb,
  user: process.env.POSTGRES_TIWATER_USER || process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_TIWATER_PASSWORD || process.env.POSTGRES_PASSWORD,
  max: parseInt(process.env.POSTGRES_TIWATER_MAX_CONNECTIONS || process.env.POSTGRES_MAX_CONNECTIONS || '20', 10),
  idleTimeoutMillis: parseInt(process.env.POSTGRES_TIWATER_IDLE_TIMEOUT || process.env.POSTGRES_IDLE_TIMEOUT || '30000', 10),
  connectionTimeoutMillis: parseInt(process.env.POSTGRES_TIWATER_CONNECTION_TIMEOUT || process.env.POSTGRES_CONNECTION_TIMEOUT || '10000', 10),
  ssl: process.env.POSTGRES_TIWATER_SSL === 'true' || process.env.POSTGRES_SSL === 'true'
    ? { rejectUnauthorized: false }
    : false,
});

pool.on('error', (err) => {
  console.error('[PostgreSQL TI_water] Unexpected idle client error:', err.message);
});

export const query = async (text, params) => pool.query(text, params);

export const getClient = async () => pool.connect();

export default pool;

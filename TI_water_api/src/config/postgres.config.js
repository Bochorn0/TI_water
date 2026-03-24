import pkg from 'pg';
import os from 'os';

const { Pool } = pkg;

const isAzure = process.env.POSTGRES_SSL === 'true';
const defaultDb = isAzure ? 'postgres' : 'tiwater_timeseries';
const db = process.env.POSTGRES_DB || defaultDb;

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  database: db,
  user: process.env.POSTGRES_USER || os.userInfo().username,
  password: process.env.POSTGRES_PASSWORD,
  max: parseInt(process.env.POSTGRES_MAX_CONNECTIONS || '20', 10),
  idleTimeoutMillis: parseInt(process.env.POSTGRES_IDLE_TIMEOUT || '30000', 10),
  connectionTimeoutMillis: parseInt(process.env.POSTGRES_CONNECTION_TIMEOUT || '10000', 10),
  ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('[PostgreSQL] Unexpected idle client error:', err.message);
});

export const query = async (text, params) => pool.query(text, params);

export default pool;

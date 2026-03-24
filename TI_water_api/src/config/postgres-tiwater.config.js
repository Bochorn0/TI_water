import pkg from 'pg';

const { Pool } = pkg;

const isAzure = process.env.POSTGRES_SSL === 'true';
const defaultTiwaterDb = isAzure ? 'postgres' : 'ti_water';
const tiwaterDb = process.env.POSTGRES_TIWATER_DB || defaultTiwaterDb;

const pool = new Pool({
  host: process.env.POSTGRES_TIWATER_HOST || process.env.POSTGRES_HOST || 'localhost',
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

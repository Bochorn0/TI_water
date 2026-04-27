import 'dotenv/config';

/**
 * Connection options for run-all-migrations.js — must match the database
 * postgres-tiwater.config.js uses for tiwater_* tables, or migrations land on
 * the wrong logical DB while the API reads another (empty products / "migrations missing").
 *
 * Mirrors resolution in postgres-tiwater.config.js (host, db, user, password, ssl).
 */

export function resolvePostgresForMigrations() {
  const isAzure = process.env.POSTGRES_SSL === 'true';
  const defaultDb = isAzure ? 'postgres' : 'ti_water';

  const database =
    process.env.POSTGRES_TIWATER_DB ||
    process.env.POSTGRES_DB ||
    defaultDb;

  const host =
    process.env.POSTGRES_TIWATER_HOST ||
    process.env.POSTGRES_HOST ||
    'localhost';

  const port = parseInt(
    process.env.POSTGRES_TIWATER_PORT || process.env.POSTGRES_PORT || '5432',
    10,
  );

  const user =
    process.env.POSTGRES_TIWATER_USER || process.env.POSTGRES_USER;

  const password =
    process.env.POSTGRES_TIWATER_PASSWORD || process.env.POSTGRES_PASSWORD;

  const ssl =
    process.env.POSTGRES_TIWATER_SSL === 'true' ||
    process.env.POSTGRES_SSL === 'true'
      ? { rejectUnauthorized: false }
      : false;

  return { host, port, database, user, password, ssl };
}

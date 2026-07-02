-- Optional one-time backfill: mark migrations as already applied without re-running SQL.
-- Use only if the schema matches these files but tiwater_migrations is empty or partial.
-- The app runner creates tiwater_migrations automatically on startup.

INSERT INTO tiwater_migrations (name) VALUES
  ('007_create_clients_table.sql'),
  ('018_create_roles_table.sql'),
  ('019_create_users_table.sql'),
  ('020_seed_roles_and_admin_user.sql'),
  ('004_create_tiwater_products_table.sql'),
  ('005_create_tiwater_quotes_table.sql'),
  ('021_add_tiwater_catalog_permission.sql'),
  ('022_seed_admin_tiwater_user.sql')
ON CONFLICT (name) DO NOTHING;

-- El Tejaban permissions (shared TI Water users/roles)
-- /el-tejaban       → mesero: POS, órdenes, cobrar
-- /el-tejaban-admin → admin: menú, pagos, contabilidad

INSERT INTO roles (name, protected, permissions, dashboard_version)
VALUES (
  'mesero',
  FALSE,
  ARRAY['/el-tejaban']::TEXT[],
  'both'
)
ON CONFLICT (name) DO NOTHING;

UPDATE roles
SET permissions = CASE
  WHEN '/el-tejaban' = ANY(permissions) AND '/el-tejaban-admin' = ANY(permissions) THEN permissions
  ELSE permissions || ARRAY['/el-tejaban', '/el-tejaban-admin']::TEXT[]
END
WHERE LOWER(name) = 'admin';

-- Mock admin for tiwater.mx login (admin@tiwater.mx / admin).
-- Bcrypt hash produced with Node bcrypt (10 rounds); matches seed-admin-user.js default password.
-- Skips if the email already exists (idempotent).

INSERT INTO users (email, password, role_id, client_id, postgres_client_id, status, verified, nombre, puesto)
SELECT
  'admin@tiwater.mx',
  '$2b$10$0QQ78/6fO9IYoSCYgnhNK.ui/YiRZXQCU2cYyF.XRhsVzHKuXjUJS',
  r.id,
  c.id,
  c.id,
  'active',
  TRUE,
  'Admin',
  'Administrator'
FROM (SELECT id FROM roles WHERE LOWER(name) = 'admin' LIMIT 1) AS r
CROSS JOIN (SELECT id FROM clients ORDER BY id LIMIT 1) AS c
WHERE NOT EXISTS (SELECT 1 FROM users WHERE LOWER(email) = 'admin@tiwater.mx');

-- Add /tiwater-catalog to admin role so JWT users can create/update/delete products.

UPDATE roles
SET permissions = CASE
  WHEN '/tiwater-catalog' = ANY(permissions) THEN permissions
  ELSE permissions || ARRAY['/tiwater-catalog']::TEXT[]
END
WHERE LOWER(name) = 'admin';

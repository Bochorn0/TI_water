-- TI Water public catalog key: TIW + type (3 letters) + 3-digit sequence, e.g. TIWVAL001
ALTER TABLE tiwater_products
  ADD COLUMN IF NOT EXISTS product_key VARCHAR(20) NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_tiwater_products_product_key
  ON tiwater_products (product_key)
  WHERE product_key IS NOT NULL;

COMMENT ON COLUMN tiwater_products.product_key IS 'Public asset/cross-catalog id, e.g. TIWVAL001; manufacturer code remains in "code"';

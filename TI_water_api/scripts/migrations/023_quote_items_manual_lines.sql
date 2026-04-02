-- Manual / fee lines: optional product_id; manual_* for concept when no product

ALTER TABLE tiwater_quote_items
  ALTER COLUMN product_id DROP NOT NULL;

ALTER TABLE tiwater_quote_items
  ADD COLUMN IF NOT EXISTS line_kind VARCHAR(20) NOT NULL DEFAULT 'product';

ALTER TABLE tiwater_quote_items
  ADD COLUMN IF NOT EXISTS manual_code VARCHAR(120);

ALTER TABLE tiwater_quote_items
  ADD COLUMN IF NOT EXISTS manual_name TEXT;

ALTER TABLE tiwater_quote_items
  ADD COLUMN IF NOT EXISTS manual_category VARCHAR(100);

COMMENT ON COLUMN tiwater_quote_items.line_kind IS 'product | manual';
COMMENT ON COLUMN tiwater_quote_items.manual_name IS 'Required for manual lines when product_id IS NULL';

DO $$
BEGIN
  RAISE NOTICE '023_quote_items_manual_lines applied';
END $$;

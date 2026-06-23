-- El Tejaban restaurant module — prefixed tables (separate from tiwater_* catalog)

CREATE TABLE IF NOT EXISTS tejaban_products (
    id BIGSERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    price DECIMAL(15, 2) NOT NULL,
    item_type VARCHAR(20) NOT NULL DEFAULT 'item',
    combo_includes JSONB DEFAULT NULL,
    image_url TEXT DEFAULT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tejaban_products_category ON tejaban_products (category);
CREATE INDEX IF NOT EXISTS idx_tejaban_products_is_active ON tejaban_products (is_active);
CREATE INDEX IF NOT EXISTS idx_tejaban_products_sort_order ON tejaban_products (sort_order);

CREATE TABLE IF NOT EXISTS tejaban_ordenes (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(100) NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'abierta',
    order_type VARCHAR(50) NOT NULL DEFAULT 'mostrador',
    table_label VARCHAR(100) DEFAULT NULL,
    subtotal DECIMAL(15, 2) NOT NULL DEFAULT 0,
    tax DECIMAL(15, 2) NOT NULL DEFAULT 0,
    total DECIMAL(15, 2) NOT NULL DEFAULT 0,
    notes TEXT DEFAULT NULL,
    created_by BIGINT DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,
    closed_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tejaban_ordenes_status ON tejaban_ordenes (status);
CREATE INDEX IF NOT EXISTS idx_tejaban_ordenes_created_at ON tejaban_ordenes (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tejaban_ordenes_order_number ON tejaban_ordenes (order_number);

CREATE TABLE IF NOT EXISTS tejaban_orden_items (
    id BIGSERIAL PRIMARY KEY,
    orden_id BIGINT NOT NULL REFERENCES tejaban_ordenes(id) ON DELETE CASCADE,
    product_id BIGINT DEFAULT NULL REFERENCES tejaban_products(id) ON DELETE SET NULL,
    manual_name VARCHAR(255) DEFAULT NULL,
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(15, 2) NOT NULL,
    subtotal DECIMAL(15, 2) NOT NULL,
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tejaban_orden_items_orden_id ON tejaban_orden_items (orden_id);
CREATE INDEX IF NOT EXISTS idx_tejaban_orden_items_product_id ON tejaban_orden_items (product_id);

CREATE TABLE IF NOT EXISTS tejaban_payments (
    id BIGSERIAL PRIMARY KEY,
    orden_id BIGINT NOT NULL REFERENCES tejaban_ordenes(id) ON DELETE CASCADE,
    method VARCHAR(50) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    terminal_ticket_ref VARCHAR(255) DEFAULT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'registrado',
    recorded_by BIGINT DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,
    paid_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tejaban_payments_orden_id ON tejaban_payments (orden_id);
CREATE INDEX IF NOT EXISTS idx_tejaban_payments_paid_at ON tejaban_payments (paid_at DESC);

CREATE OR REPLACE FUNCTION update_tejaban_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tejaban_products_updated_at ON tejaban_products;
CREATE TRIGGER trg_tejaban_products_updated_at
    BEFORE UPDATE ON tejaban_products
    FOR EACH ROW EXECUTE FUNCTION update_tejaban_updated_at_column();

DROP TRIGGER IF EXISTS trg_tejaban_ordenes_updated_at ON tejaban_ordenes;
CREATE TRIGGER trg_tejaban_ordenes_updated_at
    BEFORE UPDATE ON tejaban_ordenes
    FOR EACH ROW EXECUTE FUNCTION update_tejaban_updated_at_column();

DROP TRIGGER IF EXISTS trg_tejaban_orden_items_updated_at ON tejaban_orden_items;
CREATE TRIGGER trg_tejaban_orden_items_updated_at
    BEFORE UPDATE ON tejaban_orden_items
    FOR EACH ROW EXECUTE FUNCTION update_tejaban_updated_at_column();

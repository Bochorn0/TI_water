-- Seed El Tejaban menu (Cahuamanta "El Tejaban")

INSERT INTO tejaban_products (category, name, price, item_type, sort_order, is_active)
SELECT v.category, v.name, v.price, v.item_type, v.sort_order, TRUE
FROM (VALUES
  ('cahuamanta', 'Orden de Cahuamanta (1/2 litro)', 120::DECIMAL, 'item', 1),
  ('cahuamanta', 'Vaso de Cahuamanta', 85::DECIMAL, 'item', 2),
  ('cahuamanta', 'Vaso Bichi', 25::DECIMAL, 'item', 3),
  ('cahuamanta', 'Taco Manta al Disco', 35::DECIMAL, 'item', 4),
  ('cahuamanta', 'Quesadilla "El Tejaban"', 55::DECIMAL, 'item', 5),
  ('tacos', 'Taco de Camarón', 48::DECIMAL, 'item', 1),
  ('tacos', 'Taco de Pescado', 40::DECIMAL, 'item', 2),
  ('tacos', 'Flauta de Camarón', 25::DECIMAL, 'item', 3),
  ('bebidas', 'Aguas frescas', 25::DECIMAL, 'item', 1),
  ('bebidas', 'Refresco 600 ml', 25::DECIMAL, 'item', 2),
  ('bebidas', 'Refrescos de vidrio', 25::DECIMAL, 'item', 3),
  ('bebidas', 'Agua', 10::DECIMAL, 'item', 4)
) AS v(category, name, price, item_type, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM tejaban_products LIMIT 1);

INSERT INTO tejaban_products (category, name, description, price, item_type, combo_includes, sort_order, is_active)
SELECT 'paquetes', 'Paquete 1', 'Orden de cahuamanta + refresco + taco manta al disco', 150::DECIMAL, 'combo',
  '["Orden de cahuamanta","Refresco","Taco manta al disco"]'::JSONB, 1, TRUE
WHERE NOT EXISTS (SELECT 1 FROM tejaban_products WHERE name = 'Paquete 1');

INSERT INTO tejaban_products (category, name, description, price, item_type, combo_includes, sort_order, is_active)
SELECT 'paquetes', 'Paquete 2', 'Vaso de cahuamanta + refresco + taco manta al disco', 120::DECIMAL, 'combo',
  '["Vaso de cahuamanta","Refresco","Taco manta al disco"]'::JSONB, 2, TRUE
WHERE NOT EXISTS (SELECT 1 FROM tejaban_products WHERE name = 'Paquete 2');

INSERT INTO tejaban_products (category, name, description, price, item_type, combo_includes, sort_order, is_active)
SELECT 'paquetes', 'Paquete 3', '5 flautas de camarón + bebida', 120::DECIMAL, 'combo',
  '["5 flautas de camarón","Bebida"]'::JSONB, 3, TRUE
WHERE NOT EXISTS (SELECT 1 FROM tejaban_products WHERE name = 'Paquete 3');

INSERT INTO tejaban_products (category, name, description, price, item_type, combo_includes, sort_order, is_active)
SELECT 'paquetes', 'Paquete 4', '3 flautas de camarón + bebida', 80::DECIMAL, 'combo',
  '["3 flautas de camarón","Bebida"]'::JSONB, 4, TRUE
WHERE NOT EXISTS (SELECT 1 FROM tejaban_products WHERE name = 'Paquete 4');

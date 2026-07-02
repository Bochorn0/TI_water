-- El Tejaban — items from Uber Eats catalog not in 029 (in-store POS prices)
-- Source: https://www.ubereats.com/mx/store/cahuamanta-el-tejaban/Azge5VqrVh286onLUgEEXA
-- Uber Eats prices are higher (delivery); POS uses local counter prices below.

INSERT INTO tejaban_products (category, name, description, price, item_type, sort_order, is_active)
SELECT v.category, v.name, v.description, v.price, 'item', v.sort_order, TRUE
FROM (VALUES
  (
    'cahuamanta',
    'Quesadilla de Camarón',
    'Tortilla de maíz con guiso de camarón ranchero, verdura y salsa',
    75::DECIMAL,
    6
  ),
  (
    'cahuamanta',
    'Quesadilla de Marlin',
    'Tortilla de maíz con guiso especial de marlín, verdura y salsa',
    75::DECIMAL,
    7
  ),
  (
    'clamatos',
    'Vaso Chelado Grande',
    'Vaso 32 oz con Clamato, salsa negra 662, limón y sal',
    55::DECIMAL,
    1
  ),
  (
    'clamatos',
    'Vaso Chelado Chico',
    'Vaso 14 oz con Clamato, salsa negra 662, limón y sal',
    40::DECIMAL,
    2
  ),
  (
    'paquetes',
    'Paquete Flautas + Refresco',
    '5 flautas de camarón y refresco 450 ml',
    130::DECIMAL,
    5
  )
) AS v(category, name, description, price, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM tejaban_products p WHERE p.name = v.name);

-- Enrich descriptions on existing items (Uber Eats copy, in-store menu unchanged)
UPDATE tejaban_products SET description = 'Cahuamanta 12 oz con camarón, totopos y salsa'
WHERE name = 'Vaso de Cahuamanta' AND (description IS NULL OR description = '');

UPDATE tejaban_products SET description = 'Medio litro de cahuamanta con camarón, totopos, verdura y salsas'
WHERE name = 'Orden de Cahuamanta (1/2 litro)' AND (description IS NULL OR description = '');

UPDATE tejaban_products SET description = 'Consomé 12 oz con totopos y salsa'
WHERE name = 'Vaso Bichi' AND (description IS NULL OR description = '');

UPDATE tejaban_products SET description = 'Tortilla de maíz con manta al disco y camarón, verdura y salsas'
WHERE name = 'Quesadilla "El Tejaban"' AND (description IS NULL OR description = '');

UPDATE tejaban_products SET description = 'Camarón capeado en doble tortilla con aderezo, ensalada y salsa'
WHERE name = 'Taco de Camarón' AND (description IS NULL OR description = '');

UPDATE tejaban_products SET description = 'Pescado capeado en doble tortilla con aderezo, ensalada y salsa'
WHERE name = 'Taco de Pescado' AND (description IS NULL OR description = '');

UPDATE tejaban_products SET description = 'Taco en tortilla de maíz con manta al disco, verdura y salsa'
WHERE name = 'Taco Manta al Disco' AND (description IS NULL OR description = '');

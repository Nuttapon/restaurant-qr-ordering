-- Seed tables 1–10 with static dev QR tokens (idempotent)
INSERT INTO tables (number, qr_token) VALUES
  (1,  'tok_dev_table_01_xxxxxxxxxx'),
  (2,  'tok_dev_table_02_xxxxxxxxxx'),
  (3,  'tok_dev_table_03_xxxxxxxxxx'),
  (4,  'tok_dev_table_04_xxxxxxxxxx'),
  (5,  'tok_dev_table_05_xxxxxxxxxx'),
  (6,  'tok_dev_table_06_xxxxxxxxxx'),
  (7,  'tok_dev_table_07_xxxxxxxxxx'),
  (8,  'tok_dev_table_08_xxxxxxxxxx'),
  (9,  'tok_dev_table_09_xxxxxxxxxx'),
  (10, 'tok_dev_table_10_xxxxxxxxxx')
ON CONFLICT (number) DO NOTHING;

-- Seed menu categories (idempotent)
INSERT INTO menu_categories (name_th, name_en, sort_order) VALUES
  ('อาหารหลัก', 'Main Dishes', 1),
  ('เครื่องดื่ม', 'Drinks', 2),
  ('ของหวาน', 'Desserts', 3)
ON CONFLICT DO NOTHING;

-- Seed menu items (idempotent)
INSERT INTO menu_items (category_id, name_th, name_en, price, is_available, sort_order)
SELECT id, 'ผัดกะเพราหมูสับ', 'Stir-fried Basil Pork', 80, true, 1 FROM menu_categories WHERE name_en = 'Main Dishes'
ON CONFLICT DO NOTHING;
INSERT INTO menu_items (category_id, name_th, name_en, price, is_available, sort_order)
SELECT id, 'ข้าวผัด', 'Fried Rice', 70, true, 2 FROM menu_categories WHERE name_en = 'Main Dishes'
ON CONFLICT DO NOTHING;
INSERT INTO menu_items (category_id, name_th, name_en, price, is_available, sort_order)
SELECT id, 'ต้มยำกุ้ง', 'Tom Yum Shrimp', 120, true, 3 FROM menu_categories WHERE name_en = 'Main Dishes'
ON CONFLICT DO NOTHING;
INSERT INTO menu_items (category_id, name_th, name_en, price, is_available, sort_order)
SELECT id, 'น้ำมะนาว', 'Lime Juice', 30, true, 1 FROM menu_categories WHERE name_en = 'Drinks'
ON CONFLICT DO NOTHING;
INSERT INTO menu_items (category_id, name_th, name_en, price, is_available, sort_order)
SELECT id, 'ชาเย็น', 'Thai Iced Tea', 35, true, 2 FROM menu_categories WHERE name_en = 'Drinks'
ON CONFLICT DO NOTHING;
INSERT INTO menu_items (category_id, name_th, name_en, price, is_available, sort_order)
SELECT id, 'ข้าวเหนียวมะม่วง', 'Mango Sticky Rice', 60, true, 1 FROM menu_categories WHERE name_en = 'Desserts'
ON CONFLICT DO NOTHING;

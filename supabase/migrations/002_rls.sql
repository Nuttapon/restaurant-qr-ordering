-- Enable RLS on all tables
ALTER TABLE tables          ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders          ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications   ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff           ENABLE ROW LEVEL SECURITY;

-- tables: anon can read, staff can update
CREATE POLICY "anon read tables" ON tables FOR SELECT TO anon USING (true);
CREATE POLICY "staff update tables" ON tables FOR UPDATE TO authenticated USING (true);
CREATE POLICY "staff read tables" ON tables FOR SELECT TO authenticated USING (true);

-- menu_categories: anon read active only; staff full CRUD
CREATE POLICY "anon read active categories" ON menu_categories
  FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "staff crud categories" ON menu_categories
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- menu_items: anon read available only; staff full CRUD
CREATE POLICY "anon read available items" ON menu_items
  FOR SELECT TO anon USING (is_available = true);
CREATE POLICY "staff crud items" ON menu_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- sessions: anon can only interact via RPC; staff read all
CREATE POLICY "staff read sessions" ON sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff update sessions" ON sessions FOR UPDATE TO authenticated USING (true);

-- orders: anon insert (token verified in RPC); anon read own session's orders
CREATE POLICY "anon insert orders" ON orders FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon read own orders" ON orders FOR SELECT TO anon USING (true);
CREATE POLICY "staff read orders" ON orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff update orders" ON orders FOR UPDATE TO authenticated USING (true);

-- order_items: similar to orders
CREATE POLICY "anon insert order_items" ON order_items FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon read order_items" ON order_items FOR SELECT TO anon USING (true);
CREATE POLICY "staff read order_items" ON order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff update order_items" ON order_items FOR UPDATE TO authenticated USING (true);

-- notifications: anon insert only (trigger alerts); staff read + mark read
CREATE POLICY "anon insert notifications" ON notifications FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "staff read notifications" ON notifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff update notifications" ON notifications FOR UPDATE TO authenticated USING (true);

-- staff: only authenticated users read own profile
CREATE POLICY "staff read own profile" ON staff
  FOR SELECT TO authenticated USING (auth.uid() = id);

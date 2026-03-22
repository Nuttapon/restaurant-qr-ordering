-- Enums
CREATE TYPE table_status AS ENUM ('available', 'occupied', 'bill_requested');
CREATE TYPE session_status AS ENUM ('active', 'closed');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'done', 'cancelled');
CREATE TYPE order_item_status AS ENUM ('pending', 'cooking', 'done');
CREATE TYPE notification_type AS ENUM ('new_order', 'call_staff', 'bill_request');
CREATE TYPE staff_role AS ENUM ('admin', 'staff', 'kitchen');

-- updated_at auto-update trigger function
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tables
CREATE TABLE tables (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number     integer NOT NULL UNIQUE,
  status     table_status NOT NULL DEFAULT 'available',
  qr_token   text NOT NULL UNIQUE,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER set_updated_at BEFORE UPDATE ON tables
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Staff profiles (mirrors auth.users)
CREATE TABLE staff (
  id   uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  role staff_role NOT NULL DEFAULT 'staff'
);

-- Sessions
CREATE TABLE sessions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id   uuid NOT NULL REFERENCES tables(id),
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at   timestamptz,
  status     session_status NOT NULL DEFAULT 'active',
  closed_by  uuid REFERENCES staff(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- Enforce: only one active session per table
CREATE UNIQUE INDEX sessions_one_active_per_table
  ON sessions(table_id) WHERE status = 'active';
CREATE TRIGGER set_updated_at BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Menu
CREATE TABLE menu_categories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_th    text NOT NULL,
  name_en    text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active  boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER set_updated_at BEFORE UPDATE ON menu_categories
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TABLE menu_items (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id    uuid NOT NULL REFERENCES menu_categories(id),
  name_th        text NOT NULL,
  name_en        text NOT NULL,
  description_th text,
  description_en text,
  price          numeric(10,2) NOT NULL,
  image_url      text,
  is_available   boolean NOT NULL DEFAULT true,
  sort_order     integer NOT NULL DEFAULT 0,
  updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER set_updated_at BEFORE UPDATE ON menu_items
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Orders
CREATE TABLE orders (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id),
  table_id   uuid NOT NULL REFERENCES tables(id),
  round      integer NOT NULL DEFAULT 1,
  status     order_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER set_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TABLE order_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     uuid NOT NULL REFERENCES orders(id),
  menu_item_id uuid NOT NULL REFERENCES menu_items(id),
  quantity     integer NOT NULL CHECK (quantity > 0),
  unit_price   numeric(10,2) NOT NULL,
  note         text,
  status       order_item_status NOT NULL DEFAULT 'pending',
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER set_updated_at BEFORE UPDATE ON order_items
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Notifications
CREATE TABLE notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id   uuid NOT NULL REFERENCES tables(id),
  type       notification_type NOT NULL,
  order_id   uuid REFERENCES orders(id),
  is_read    boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Performance indexes on FK columns
CREATE INDEX idx_sessions_table_id ON sessions(table_id);
CREATE INDEX idx_orders_session_id ON orders(session_id);
CREATE INDEX idx_orders_table_id ON orders(table_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_menu_item_id ON order_items(menu_item_id);
CREATE INDEX idx_notifications_table_id ON notifications(table_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read) WHERE is_read = false;
CREATE INDEX idx_menu_items_category_id ON menu_items(category_id);

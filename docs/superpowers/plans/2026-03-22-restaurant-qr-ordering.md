# Restaurant QR Ordering System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack restaurant QR ordering system where customers scan a QR code at their table, browse the menu, and place orders — while kitchen staff and admin see live updates with sound alerts.

**Architecture:** Next.js 15 App Router with three surfaces (customer `/menu`, kitchen `/kitchen`, admin `/admin`) in a single codebase. Supabase provides PostgreSQL, Realtime pub/sub, Auth, and file Storage — no separate backend server needed. Notifications table drives all alerts via Supabase Realtime → Web Audio API.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, Supabase (PostgreSQL + Realtime + Auth + Storage), Vercel (deploy), nanoid (QR tokens), qrcode.react (QR generation), zustand (cart state), vitest (unit tests)

---

## File Map

```
restaurant-qr-ordering/
├── app/
│   ├── layout.tsx                  Root layout, Tailwind fonts
│   ├── page.tsx                    Root redirect → /admin or /menu
│   ├── menu/page.tsx               Customer ordering UI (public)
│   ├── kitchen/page.tsx            Kitchen display (public, no auth)
│   ├── login/page.tsx              Staff login page
│   ├── admin/
│   │   ├── layout.tsx              Auth guard for all /admin routes
│   │   ├── page.tsx                Admin dashboard — table grid + alerts
│   │   ├── menu/page.tsx           Menu management (CRUD + image upload)
│   │   └── tables/page.tsx         Table management + QR generation
│   └── api/
│       ├── orders/route.ts         POST /api/orders — create order + items
│       └── notifications/route.ts  POST /api/notifications — call/bill events
├── components/
│   ├── customer/
│   │   ├── CategoryTabs.tsx        Horizontal scrollable category filter
│   │   ├── MenuItemCard.tsx        Food card with + button
│   │   ├── CartDrawer.tsx          Slide-up cart with qty controls + submit
│   │   └── OrderSummary.tsx        Post-order view with all rounds, action buttons
│   ├── kitchen/
│   │   ├── OrderCard.tsx           Single order card with item checkboxes
│   │   └── TimerBadge.tsx          Color-coded elapsed time badge
│   ├── admin/
│   │   ├── TableGrid.tsx           Responsive table status grid
│   │   ├── NotificationBanner.tsx  Alert strip for call/bill events
│   │   ├── BillModal.tsx           Full session summary + close bill button
│   │   └── MenuForm.tsx            Create/edit menu item form with image upload
│   └── shared/
│       └── SoundAlert.tsx          Web Audio API ding player, used by kitchen + admin
├── lib/
│   ├── supabase/
│   │   ├── client.ts               createBrowserClient (singleton)
│   │   └── server.ts               createServerClient (for Server Components + API Routes)
│   ├── realtime/
│   │   └── hooks.ts                useKitchenNotifications, useAdminNotifications, useOrderItems
│   └── utils.ts                    formatPrice(n), timeAgo(date), cn() classname helper
├── store/
│   └── cart.ts                     Zustand cart store — items, add, remove, clear
├── types/
│   └── database.ts                 Supabase generated types (Tables, Enums, RPCs)
├── middleware.ts                   Protect /admin routes — redirect to /login if no session
├── supabase/
│   └── migrations/
│       ├── 001_schema.sql          All tables, enums, indexes, updated_at triggers
│       ├── 002_rls.sql             Row-Level Security policies
│       └── 003_rpc.sql             get_or_create_session() function
└── public/
    └── sounds/
        └── ding.mp3                Short notification sound
```

---

## Task 1: Project Bootstrap

**Files:**
- Create: `restaurant-qr-ordering/` (Next.js project root)
- Create: `.env.local`
- Create: `package.json` (via scaffold)

- [ ] **Step 1: Scaffold Next.js project**

```bash
cd /Users/nuttapon/Nutty
npx create-next-app@latest restaurant-qr-ordering \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias "@/*"
cd restaurant-qr-ordering
```

- [ ] **Step 2: Install dependencies**

```bash
npm install @supabase/ssr @supabase/supabase-js nanoid qrcode.react zustand
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 3: Configure vitest**

Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
})
```

Create `vitest.setup.ts`:
```typescript
import '@testing-library/jest-dom'
```

Add to `package.json` scripts:
```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 4: Create `.env.local`**

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

> Get these from Supabase dashboard → Project Settings → API

- [ ] **Step 5: Download a short ding sound**

```bash
mkdir -p public/sounds
# Download any short notification sound as public/sounds/ding.mp3
# Free option: https://freesound.org/people/original_sound/sounds/366102/
# Or use base64 inline in SoundAlert.tsx — see Task 8
```

- [ ] **Step 6: Verify dev server starts**

```bash
npm run dev
```
Expected: `http://localhost:3000` loads Next.js default page.

- [ ] **Step 7: Initial commit**

```bash
git init
git add -A
git commit -m "chore: scaffold Next.js 15 project with Supabase + Tailwind"
```

---

## Task 2: Database Migrations

**Files:**
- Create: `supabase/migrations/001_schema.sql`
- Create: `supabase/migrations/002_rls.sql`
- Create: `supabase/migrations/003_rpc.sql`

Run all SQL in the Supabase Dashboard → SQL Editor (or via `supabase db push` if CLI is installed).

- [ ] **Step 1: Create `supabase/migrations/001_schema.sql`**

```sql
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
```

- [ ] **Step 2: Run 001_schema.sql in Supabase SQL Editor**

Paste contents into Supabase Dashboard → SQL Editor → Run.
Expected: No errors, tables visible in Table Editor.

- [ ] **Step 3: Create `supabase/migrations/002_rls.sql`**

```sql
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
-- We store session_id — client passes session_id from get_or_create_session result
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
```

- [ ] **Step 4: Run 002_rls.sql in Supabase SQL Editor**

Expected: No errors.

- [ ] **Step 5: Create `supabase/migrations/003_rpc.sql`**

```sql
CREATE OR REPLACE FUNCTION get_or_create_session(p_qr_token TEXT)
RETURNS json AS $$
DECLARE
  v_table  tables%ROWTYPE;
  v_session sessions%ROWTYPE;
BEGIN
  -- Verify token exists
  SELECT * INTO v_table FROM tables WHERE qr_token = p_qr_token;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_token' USING HINT = 'QR token not found';
  END IF;

  -- Atomic: insert new active session only if none exists
  INSERT INTO sessions (table_id, status)
  VALUES (v_table.id, 'active')
  ON CONFLICT ON CONSTRAINT sessions_one_active_per_table DO NOTHING;

  -- Fetch the active session (created above or existing)
  SELECT * INTO v_session FROM sessions
  WHERE table_id = v_table.id AND status = 'active';

  -- Update table status to occupied
  UPDATE tables SET status = 'occupied' WHERE id = v_table.id;

  RETURN json_build_object(
    'session', row_to_json(v_session),
    'table', row_to_json(v_table)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution to anon role
GRANT EXECUTE ON FUNCTION get_or_create_session(TEXT) TO anon;
```

- [ ] **Step 6: Run 003_rpc.sql in Supabase SQL Editor**

Expected: Function created, visible in Database → Functions.

- [ ] **Step 7: Enable Realtime for notifications table**

Supabase Dashboard → Database → Replication → enable `notifications` table for Realtime.
Also enable `order_items` table.

- [ ] **Step 8: Seed test data**

Run in SQL Editor:
```sql
-- Seed tables 1–10
INSERT INTO tables (number, qr_token) VALUES
  (1, 'tok_table_1_xxxxxxxxxxxxxxxxx'),
  (2, 'tok_table_2_xxxxxxxxxxxxxxxxx'),
  (3, 'tok_table_3_xxxxxxxxxxxxxxxxx'),
  (4, 'tok_table_4_xxxxxxxxxxxxxxxxx'),
  (5, 'tok_table_5_xxxxxxxxxxxxxxxxx');

-- Seed categories
INSERT INTO menu_categories (name_th, name_en, sort_order) VALUES
  ('อาหารหลัก', 'Main Dishes', 1),
  ('เครื่องดื่ม', 'Drinks', 2),
  ('ของหวาน', 'Desserts', 3);

-- Seed menu items (use the category UUIDs from above)
-- Get category IDs first:
-- SELECT id, name_th FROM menu_categories;
-- Then insert with real IDs, e.g.:
INSERT INTO menu_items (category_id, name_th, name_en, price, is_available) VALUES
  ((SELECT id FROM menu_categories WHERE name_en='Main Dishes'), 'ผัดกะเพราหมูสับ', 'Stir-fried Basil Pork', 80, true),
  ((SELECT id FROM menu_categories WHERE name_en='Main Dishes'), 'ข้าวผัด', 'Fried Rice', 70, true),
  ((SELECT id FROM menu_categories WHERE name_en='Drinks'), 'น้ำมะนาว', 'Lime Juice', 30, true),
  ((SELECT id FROM menu_categories WHERE name_en='Desserts'), 'ข้าวเหนียวมะม่วง', 'Mango Sticky Rice', 60, true);
```

- [ ] **Step 9: Commit**

```bash
git add supabase/
git commit -m "feat: database schema, RLS policies, and get_or_create_session RPC"
```

---

## Task 3: Supabase Client + Types

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `types/database.ts`
- Create: `lib/utils.ts`
- Create: `middleware.ts`

- [ ] **Step 1: Write test for formatPrice utility**

Create `lib/__tests__/utils.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { formatPrice } from '../utils'

describe('formatPrice', () => {
  it('formats whole number prices', () => {
    expect(formatPrice(80)).toBe('฿80')
  })
  it('formats decimal prices', () => {
    expect(formatPrice(49.50)).toBe('฿49.50')
  })
  it('formats zero', () => {
    expect(formatPrice(0)).toBe('฿0')
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm run test -- lib/__tests__/utils.test.ts
```
Expected: FAIL — `formatPrice is not a function`

- [ ] **Step 3: Create `lib/utils.ts`**

```typescript
export function formatPrice(price: number): string {
  const formatted = price % 1 === 0 ? String(price) : price.toFixed(2)
  return `฿${formatted}`
}

export function timeAgo(date: string | Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  return `${Math.floor(minutes / 60)}h`
}

/** Merge class names (lightweight, no dependency needed) */
export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npm run test -- lib/__tests__/utils.test.ts
```
Expected: PASS (3 tests)

- [ ] **Step 5: Create `types/database.ts`**

Generate types from Supabase CLI (preferred):
```bash
npx supabase gen types typescript \
  --project-id YOUR_PROJECT_ID \
  --schema public > types/database.ts
```

If CLI unavailable, create manually with minimum types:
```typescript
export type TableStatus = 'available' | 'occupied' | 'bill_requested'
export type OrderStatus = 'pending' | 'confirmed' | 'done' | 'cancelled'
export type OrderItemStatus = 'pending' | 'cooking' | 'done'
export type NotificationType = 'new_order' | 'call_staff' | 'bill_request'
export type StaffRole = 'admin' | 'staff' | 'kitchen'

export interface Table {
  id: string
  number: number
  status: TableStatus
  qr_token: string
  updated_at: string
}

export interface Session {
  id: string
  table_id: string
  started_at: string
  ended_at: string | null
  status: 'active' | 'closed'
  closed_by: string | null
  updated_at: string
}

export interface MenuCategory {
  id: string
  name_th: string
  name_en: string
  sort_order: number
  is_active: boolean
  updated_at: string
}

export interface MenuItem {
  id: string
  category_id: string
  name_th: string
  name_en: string
  description_th: string | null
  description_en: string | null
  price: number
  image_url: string | null
  is_available: boolean
  sort_order: number
  updated_at: string
}

export interface Order {
  id: string
  session_id: string
  table_id: string
  round: number
  status: OrderStatus
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  menu_item_id: string
  quantity: number
  unit_price: number
  note: string | null
  status: OrderItemStatus
  updated_at: string
}

export interface Notification {
  id: string
  table_id: string
  type: NotificationType
  order_id: string | null
  is_read: boolean
  created_at: string
}

export interface Staff {
  id: string
  name: string
  role: StaffRole
}
```

- [ ] **Step 6: Create `lib/supabase/client.ts`**

```typescript
import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | null = null

export function getSupabaseBrowserClient() {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return client
}
```

- [ ] **Step 7: Create `lib/supabase/server.ts`**

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function getSupabaseServerClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

- [ ] **Step 8: Create `middleware.ts`** (protect /admin routes)

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (request.nextUrl.pathname.startsWith('/admin') && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*'],
}
```

- [ ] **Step 9: Create `store/cart.ts`**

```typescript
import { create } from 'zustand'
import { MenuItem } from '@/types/database'

export interface CartItem {
  menuItem: MenuItem
  quantity: number
  note?: string
}

interface CartStore {
  items: CartItem[]
  addItem: (menuItem: MenuItem) => void
  removeItem: (menuItemId: string) => void
  updateQuantity: (menuItemId: string, quantity: number) => void
  clearCart: () => void
  totalPrice: () => number
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],

  addItem: (menuItem) => set((state) => {
    const existing = state.items.find(i => i.menuItem.id === menuItem.id)
    if (existing) {
      return {
        items: state.items.map(i =>
          i.menuItem.id === menuItem.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      }
    }
    return { items: [...state.items, { menuItem, quantity: 1 }] }
  }),

  removeItem: (menuItemId) => set((state) => ({
    items: state.items.filter(i => i.menuItem.id !== menuItemId)
  })),

  updateQuantity: (menuItemId, quantity) => set((state) => {
    if (quantity <= 0) {
      return { items: state.items.filter(i => i.menuItem.id !== menuItemId) }
    }
    return {
      items: state.items.map(i =>
        i.menuItem.id === menuItemId ? { ...i, quantity } : i
      )
    }
  }),

  clearCart: () => set({ items: [] }),

  totalPrice: () => get().items.reduce(
    (sum, item) => sum + item.menuItem.price * item.quantity, 0
  ),
}))
```

- [ ] **Step 10: Write cart store test**

Create `store/__tests__/cart.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { useCartStore } from '../cart'

const mockItem = {
  id: 'item-1', name_th: 'ผัดกะเพรา', name_en: 'Basil Stir-fry',
  price: 80, category_id: 'cat-1', sort_order: 0,
  description_th: null, description_en: null,
  image_url: null, is_available: true, updated_at: ''
}

describe('useCartStore', () => {
  beforeEach(() => useCartStore.getState().clearCart())

  it('adds item to cart', () => {
    useCartStore.getState().addItem(mockItem)
    expect(useCartStore.getState().items).toHaveLength(1)
  })

  it('increments quantity on duplicate add', () => {
    useCartStore.getState().addItem(mockItem)
    useCartStore.getState().addItem(mockItem)
    expect(useCartStore.getState().items[0].quantity).toBe(2)
  })

  it('removes item when quantity set to 0', () => {
    useCartStore.getState().addItem(mockItem)
    useCartStore.getState().updateQuantity('item-1', 0)
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('calculates total price correctly', () => {
    useCartStore.getState().addItem(mockItem)
    useCartStore.getState().addItem(mockItem)
    expect(useCartStore.getState().totalPrice()).toBe(160)
  })
})
```

- [ ] **Step 11: Run cart tests**

```bash
npm run test -- store/__tests__/cart.test.ts
```
Expected: PASS (4 tests)

- [ ] **Step 12: Create `lib/realtime/hooks.ts`**

```typescript
'use client'
import { useEffect } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { Notification, OrderItem } from '@/types/database'

export function useKitchenNotifications(onNew: (n: Notification) => void) {
  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    const channel = supabase
      .channel('kitchen-orders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications',
          filter: 'type=eq.new_order' },
        (payload) => onNew(payload.new as Notification)
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [onNew])
}

export function useAdminNotifications(onNew: (n: Notification) => void) {
  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    const channel = supabase
      .channel('admin-alerts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const n = payload.new as Notification
          if (['call_staff', 'bill_request'].includes(n.type)) onNew(n)
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [onNew])
}

export function useOrderItemUpdates(
  orderId: string,
  onUpdate: (item: OrderItem) => void
) {
  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    const channel = supabase
      .channel(`order-items-${orderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'order_items',
          filter: `order_id=eq.${orderId}` },
        (payload) => onUpdate(payload.new as OrderItem)
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [orderId, onUpdate])
}
```

- [ ] **Step 13: Commit**

```bash
git add lib/ types/ store/ middleware.ts
git commit -m "feat: Supabase clients, TypeScript types, cart store, realtime hooks"
```

---

## Task 4: Shared Sound Alert Component

**Files:**
- Create: `components/shared/SoundAlert.tsx`

- [ ] **Step 1: Create `components/shared/SoundAlert.tsx`**

This component uses Web Audio API to generate a ding programmatically (no MP3 needed).

```typescript
'use client'
import { useCallback } from 'react'

export function useSoundAlert() {
  const playDing = useCallback(() => {
    try {
      const ctx = new AudioContext()
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(880, ctx.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3)

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)

      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.5)
    } catch {
      // AudioContext not available (SSR or restricted environment)
    }
  }, [])

  return { playDing }
}
```

- [ ] **Step 2: Commit**

```bash
git add components/shared/
git commit -m "feat: Web Audio API sound alert hook"
```

---

## Task 5: Customer Menu Page

**Files:**
- Create: `app/menu/page.tsx`
- Create: `components/customer/CategoryTabs.tsx`
- Create: `components/customer/MenuItemCard.tsx`
- Create: `components/customer/CartDrawer.tsx`

- [ ] **Step 1: Create `components/customer/CategoryTabs.tsx`**

```typescript
'use client'
import { MenuCategory } from '@/types/database'
import { cn } from '@/lib/utils'

interface Props {
  categories: MenuCategory[]
  activeId: string | null
  onSelect: (id: string | null) => void
}

export function CategoryTabs({ categories, activeId, onSelect }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          'flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
          activeId === null
            ? 'bg-orange-500 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        )}
      >
        ทั้งหมด / All
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={cn(
            'flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
            activeId === cat.id
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          {cat.name_th}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Create `components/customer/MenuItemCard.tsx`**

```typescript
'use client'
import Image from 'next/image'
import { MenuItem } from '@/types/database'
import { useCartStore } from '@/store/cart'
import { formatPrice } from '@/lib/utils'

interface Props {
  item: MenuItem
}

export function MenuItemCard({ item }: Props) {
  const { addItem, items } = useCartStore()
  const inCart = items.find(i => i.menuItem.id === item.id)

  return (
    <div className="flex gap-3 p-3 bg-white rounded-xl shadow-sm border border-gray-100">
      {item.image_url ? (
        <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
          <Image
            src={item.image_url}
            alt={item.name_th}
            fill
            className="object-cover"
          />
        </div>
      ) : (
        <div className="w-20 h-20 flex-shrink-0 rounded-lg bg-orange-100 flex items-center justify-center text-2xl">
          🍽️
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 truncate">{item.name_th}</p>
        <p className="text-xs text-gray-400 truncate">{item.name_en}</p>
        {item.description_th && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.description_th}</p>
        )}
        <p className="text-orange-500 font-bold mt-1">{formatPrice(item.price)}</p>
      </div>
      <button
        onClick={() => addItem(item)}
        className="self-center flex-shrink-0 w-8 h-8 rounded-full bg-orange-500 text-white text-xl font-bold hover:bg-orange-600 transition-colors flex items-center justify-center"
        aria-label={`เพิ่ม ${item.name_th}`}
      >
        {inCart ? `+${inCart.quantity}` : '+'}
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Create `components/customer/CartDrawer.tsx`**

```typescript
'use client'
import { useState } from 'react'
import { useCartStore } from '@/store/cart'
import { formatPrice } from '@/lib/utils'

interface Props {
  sessionId: string
  tableId: string
  onOrderPlaced: (orderId: string) => void
}

export function CartDrawer({ sessionId, tableId, onOrderPlaced }: Props) {
  const { items, updateQuantity, removeItem, clearCart, totalPrice } = useCartStore()
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const total = totalPrice()
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          tableId,
          items: items.map(i => ({
            menuItemId: i.menuItem.id,
            quantity: i.quantity,
            unitPrice: i.menuItem.price,
            note: i.note ?? null,
          })),
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'ส่งออเดอร์ไม่สำเร็จ')
      }
      const { orderId } = await res.json()
      clearCart()
      setOpen(false)
      onOrderPlaced(orderId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setSubmitting(false)
    }
  }

  if (itemCount === 0) return null

  return (
    <>
      {/* Floating cart button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3 z-40 hover:bg-orange-600 transition-colors"
      >
        <span className="bg-white text-orange-500 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
          {itemCount}
        </span>
        <span className="font-semibold">ดูตะกร้า</span>
        <span className="font-bold">{formatPrice(total)}</span>
      </button>

      {/* Drawer backdrop */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <div className="relative bg-white rounded-t-2xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold">รายการสั่ง</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 text-2xl">✕</button>
            </div>

            <div className="overflow-y-auto flex-1 p-4 space-y-3">
              {items.map(({ menuItem, quantity }) => (
                <div key={menuItem.id} className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{menuItem.name_th}</p>
                    <p className="text-orange-500 text-sm">{formatPrice(menuItem.price)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(menuItem.id, quantity - 1)}
                      className="w-8 h-8 rounded-full bg-gray-100 font-bold text-lg flex items-center justify-center"
                    >−</button>
                    <span className="w-6 text-center font-bold">{quantity}</span>
                    <button
                      onClick={() => updateQuantity(menuItem.id, quantity + 1)}
                      className="w-8 h-8 rounded-full bg-orange-500 text-white font-bold text-lg flex items-center justify-center"
                    >+</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t space-y-3">
              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
                  {error}
                  <button onClick={handleSubmit} className="ml-2 underline">ลองใหม่</button>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg">
                <span>รวม</span>
                <span className="text-orange-500">{formatPrice(total)}</span>
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold text-lg disabled:opacity-50 hover:bg-orange-600 transition-colors"
              >
                {submitting ? 'กำลังส่ง...' : 'สั่งอาหาร ✓'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 4: Create `app/api/orders/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient()
  const { sessionId, tableId, items } = await request.json()

  if (!sessionId || !tableId || !items?.length) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Get current round count for this session
  const { count } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', sessionId)

  const round = (count ?? 0) + 1

  // Create order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({ session_id: sessionId, table_id: tableId, round, status: 'pending' })
    .select()
    .single()

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 500 })
  }

  // Create order items
  const orderItems = items.map((item: {
    menuItemId: string; quantity: number; unitPrice: number; note?: string
  }) => ({
    order_id: order.id,
    menu_item_id: item.menuItemId,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    note: item.note ?? null,
    status: 'pending',
  }))

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems)

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 })
  }

  // Create notification
  await supabase
    .from('notifications')
    .insert({ table_id: tableId, type: 'new_order', order_id: order.id })

  return NextResponse.json({ orderId: order.id })
}
```

- [ ] **Step 5: Create `app/api/notifications/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient()
  const { tableId, type } = await request.json()

  if (!tableId || !['call_staff', 'bill_request'].includes(type)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { error } = await supabase
    .from('notifications')
    .insert({ table_id: tableId, type })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Update table status if bill requested
  if (type === 'bill_request') {
    await supabase
      .from('tables')
      .update({ status: 'bill_requested' })
      .eq('id', tableId)
  }

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 6: Create `app/menu/page.tsx`**

```typescript
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { MenuPageClient } from './MenuPageClient'
import { redirect } from 'next/navigation'

interface Props {
  searchParams: Promise<{ token?: string }>
}

export default async function MenuPage({ searchParams }: Props) {
  const { token } = await searchParams

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <div className="text-center p-8">
          <p className="text-4xl mb-4">📱</p>
          <h1 className="text-xl font-bold text-gray-700">กรุณาสแกน QR Code</h1>
          <p className="text-gray-500 mt-2">Please scan the QR code at your table</p>
        </div>
      </div>
    )
  }

  const supabase = await getSupabaseServerClient()

  // Call get_or_create_session RPC
  const { data, error } = await supabase.rpc('get_or_create_session', {
    p_qr_token: token,
  })

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <div className="text-center p-8">
          <p className="text-4xl mb-4">❌</p>
          <h1 className="text-xl font-bold text-gray-700">ไม่พบโต๊ะนี้</h1>
          <p className="text-gray-500 mt-2">กรุณาสแกน QR Code ใหม่</p>
          <p className="text-gray-400 text-sm mt-1">Table not found. Please scan again.</p>
        </div>
      </div>
    )
  }

  // Fetch menu
  const { data: categories } = await supabase
    .from('menu_categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')

  const { data: menuItems } = await supabase
    .from('menu_items')
    .select('*')
    .eq('is_available', true)
    .order('sort_order')

  if (!menuItems?.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <div className="text-center p-8">
          <p className="text-4xl mb-4">🍽️</p>
          <h1 className="text-xl font-bold text-gray-700">เมนูยังไม่พร้อม</h1>
          <p className="text-gray-500 mt-2">กรุณาติดต่อพนักงาน</p>
        </div>
      </div>
    )
  }

  return (
    <MenuPageClient
      session={data.session}
      table={data.table}
      categories={categories ?? []}
      menuItems={menuItems ?? []}
    />
  )
}
```

- [ ] **Step 7: Create `app/menu/MenuPageClient.tsx`**

```typescript
'use client'
import { useState } from 'react'
import { Session, Table, MenuCategory, MenuItem } from '@/types/database'
import { CategoryTabs } from '@/components/customer/CategoryTabs'
import { MenuItemCard } from '@/components/customer/MenuItemCard'
import { CartDrawer } from '@/components/customer/CartDrawer'
import { OrderSummary } from '@/components/customer/OrderSummary'

interface Props {
  session: Session
  table: Table
  categories: MenuCategory[]
  menuItems: MenuItem[]
}

export function MenuPageClient({ session, table, categories, menuItems }: Props) {
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)
  const [placedOrderIds, setPlacedOrderIds] = useState<string[]>([])
  const [showSummary, setShowSummary] = useState(false)

  const filtered = activeCategoryId
    ? menuItems.filter(i => i.category_id === activeCategoryId)
    : menuItems

  function handleOrderPlaced(orderId: string) {
    setPlacedOrderIds(prev => [...prev, orderId])
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-orange-500 text-white px-4 py-3 flex justify-between items-center sticky top-0 z-30">
        <h1 className="font-bold text-lg">🍜 เมนู</h1>
        <span className="text-sm bg-orange-400 px-3 py-1 rounded-full">โต๊ะ {table.number}</span>
      </div>

      {/* Category tabs */}
      <div className="px-4 py-3 bg-white border-b sticky top-14 z-20">
        <CategoryTabs
          categories={categories}
          activeId={activeCategoryId}
          onSelect={setActiveCategoryId}
        />
      </div>

      {/* Menu items */}
      <div className="px-4 py-3 space-y-3 pb-32">
        {filtered.map(item => (
          <MenuItemCard key={item.id} item={item} />
        ))}
      </div>

      {/* Post-order actions — show after at least 1 order */}
      {placedOrderIds.length > 0 && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 flex gap-2 z-40">
          <button
            onClick={() => {
              fetch('/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tableId: table.id, type: 'call_staff' }),
              })
            }}
            className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-medium shadow-md"
          >
            🙋 เรียกพนักงาน
          </button>
          <button
            onClick={() => setShowSummary(true)}
            className="bg-pink-100 text-pink-800 px-4 py-2 rounded-full text-sm font-medium shadow-md"
          >
            🧾 เช็คบิล
          </button>
        </div>
      )}

      {/* Cart */}
      <CartDrawer
        sessionId={session.id}
        tableId={table.id}
        onOrderPlaced={handleOrderPlaced}
      />

      {/* Bill summary modal */}
      {showSummary && (
        <OrderSummary
          sessionId={session.id}
          tableId={table.id}
          tableNumber={table.number}
          onClose={() => setShowSummary(false)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 8: Create `components/customer/OrderSummary.tsx`**

```typescript
'use client'
import { useEffect, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { Order, OrderItem, MenuItem } from '@/types/database'
import { formatPrice } from '@/lib/utils'

interface Props {
  sessionId: string
  tableId: string
  tableNumber: number
  onClose: () => void
}

type OrderWithItems = Order & {
  order_items: (OrderItem & { menu_items: MenuItem })[]
}

export function OrderSummary({ sessionId, tableId, tableNumber, onClose }: Props) {
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [requested, setRequested] = useState(false)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    supabase
      .from('orders')
      .select('*, order_items(*, menu_items(*))')
      .eq('session_id', sessionId)
      .order('round')
      .then(({ data }) => setOrders((data as OrderWithItems[]) ?? []))
  }, [sessionId])

  const total = orders.reduce((sum, order) =>
    sum + order.order_items.reduce((s, item) =>
      s + item.unit_price * item.quantity, 0
    ), 0
  )

  async function handleRequestBill() {
    setSubmitting(true)
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableId, type: 'bill_request' }),
    })
    setRequested(true)
    setSubmitting(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl max-h-[85vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-bold">สรุปรายการ — โต๊ะ {tableNumber}</h2>
          <button onClick={onClose} className="text-gray-400 text-2xl">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {orders.map(order => (
            <div key={order.id}>
              <p className="text-xs text-gray-400 font-semibold uppercase mb-2">
                รอบที่ {order.round}
              </p>
              {order.order_items.map(item => (
                <div key={item.id} className="flex justify-between text-sm py-1">
                  <span>{item.menu_items.name_th} × {item.quantity}</span>
                  <span>{formatPrice(item.unit_price * item.quantity)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="p-4 border-t space-y-3">
          <div className="flex justify-between font-bold text-xl">
            <span>รวมทั้งหมด</span>
            <span className="text-orange-500">{formatPrice(total)}</span>
          </div>

          {requested ? (
            <div className="bg-green-50 text-green-700 text-center p-3 rounded-xl font-medium">
              ✅ แจ้งเรียบร้อยแล้ว พนักงานกำลังมา
            </div>
          ) : (
            <button
              onClick={handleRequestBill}
              disabled={submitting}
              className="w-full bg-red-500 text-white py-3 rounded-xl font-bold text-lg disabled:opacity-50 hover:bg-red-600 transition-colors"
            >
              {submitting ? 'กำลังส่ง...' : '🧾 ขอเช็คบิล'}
            </button>
          )}
          <p className="text-center text-xs text-gray-400">พนักงานจะมาหาคุณในไม่ช้า</p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 9: Verify customer flow manually**

```bash
npm run dev
# Open: http://localhost:3000/menu?token=tok_table_1_xxxxxxxxxxxxxxxxx
```
Expected:
- Menu items displayed with TH/EN names and prices
- Click + on item → floating cart button appears
- Open cart → adjust qty → submit → success
- "เรียกพนักงาน" and "เช็คบิล" buttons appear after first order

- [ ] **Step 10: Commit**

```bash
git add app/menu/ app/api/ components/customer/
git commit -m "feat: customer menu page — browse, cart, order placement, call staff, check bill"
```

---

## Task 6: Kitchen Display

**Files:**
- Create: `app/kitchen/page.tsx`
- Create: `components/kitchen/OrderCard.tsx`
- Create: `components/kitchen/TimerBadge.tsx`

- [ ] **Step 1: Create `components/kitchen/TimerBadge.tsx`**

```typescript
'use client'
import { useEffect, useState } from 'react'
import { timeAgo } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Props {
  createdAt: string
}

export function TimerBadge({ createdAt }: Props) {
  const [elapsed, setElapsed] = useState('')
  const [minutes, setMinutes] = useState(0)

  useEffect(() => {
    function update() {
      const secs = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000)
      setMinutes(Math.floor(secs / 60))
      setElapsed(timeAgo(createdAt))
    }
    update()
    const interval = setInterval(update, 10_000)
    return () => clearInterval(interval)
  }, [createdAt])

  return (
    <span className={cn(
      'text-xs px-2 py-1 rounded-full font-medium',
      minutes < 5  ? 'bg-green-100 text-green-700' :
      minutes < 10 ? 'bg-yellow-100 text-yellow-700' :
                     'bg-red-100 text-red-700 animate-pulse'
    )}>
      ⏱ {elapsed}
    </span>
  )
}
```

- [ ] **Step 2: Create `components/kitchen/OrderCard.tsx`**

```typescript
'use client'
import { useState } from 'react'
import { Order, OrderItem, MenuItem } from '@/types/database'
import { TimerBadge } from './TimerBadge'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

type OrderWithItems = Order & {
  order_items: (OrderItem & { menu_items: MenuItem })[]
  tables: { number: number }
}

interface Props {
  order: OrderWithItems
}

export function OrderCard({ order }: Props) {
  const [items, setItems] = useState(order.order_items)

  async function markItemDone(itemId: string) {
    const supabase = getSupabaseBrowserClient()
    await supabase
      .from('order_items')
      .update({ status: 'done' })
      .eq('id', itemId)
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, status: 'done' } : i))
  }

  const allDone = items.every(i => i.status === 'done')

  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${
      allDone ? 'border-green-400 opacity-60' : 'border-orange-400'
    }`}>
      <div className="flex justify-between items-center mb-3">
        <div>
          <span className="text-xl font-bold">โต๊ะ {order.tables.number}</span>
          <span className="ml-2 text-sm text-gray-400">รอบ {order.round} · #{order.id.slice(-4)}</span>
        </div>
        <TimerBadge createdAt={order.created_at} />
      </div>

      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className="flex justify-between items-center">
            <div className={item.status === 'done' ? 'line-through text-gray-400' : ''}>
              <span className="font-medium">{item.menu_items.name_th}</span>
              <span className="text-gray-500 ml-2">× {item.quantity}</span>
              {item.note && (
                <p className="text-xs text-orange-600">📝 {item.note}</p>
              )}
            </div>
            {item.status !== 'done' ? (
              <button
                onClick={() => markItemDone(item.id)}
                className="text-xs bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 transition-colors"
              >
                ✓ Done
              </button>
            ) : (
              <span className="text-xs text-green-500 font-medium">✓ Done</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create `app/kitchen/page.tsx`**

```typescript
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { KitchenClient } from './KitchenClient'

export default async function KitchenPage() {
  const supabase = await getSupabaseServerClient()

  const { data: orders } = await supabase
    .from('orders')
    .select('*, order_items(*, menu_items(*)), tables(number)')
    .in('status', ['pending', 'confirmed'])
    .order('created_at', { ascending: true })

  return <KitchenClient initialOrders={orders ?? []} />
}
```

- [ ] **Step 4: Create `app/kitchen/KitchenClient.tsx`**

```typescript
'use client'
import { useState, useCallback } from 'react'
import { OrderCard } from '@/components/kitchen/OrderCard'
import { useKitchenNotifications } from '@/lib/realtime/hooks'
import { useSoundAlert } from '@/components/shared/SoundAlert'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { Notification } from '@/types/database'

interface Props {
  initialOrders: any[]
}

export function KitchenClient({ initialOrders }: Props) {
  const [orders, setOrders] = useState(initialOrders)
  const { playDing } = useSoundAlert()

  const handleNewOrder = useCallback(async (notification: Notification) => {
    playDing()
    if (!notification.order_id) return

    const supabase = getSupabaseBrowserClient()
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*, menu_items(*)), tables(number)')
      .eq('id', notification.order_id)
      .single()

    if (data) {
      setOrders(prev => [...prev, data])
    }
  }, [playDing])

  useKitchenNotifications(handleNewOrder)

  const pendingOrders = orders.filter(o => o.status !== 'done' && o.status !== 'cancelled')

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="bg-slate-800 px-4 py-3 flex justify-between items-center">
        <h1 className="font-bold text-lg">🍳 Kitchen Board</h1>
        <span className="text-slate-400 text-sm">
          {pendingOrders.length} ออเดอร์รออยู่
        </span>
      </div>

      <div className="p-4 space-y-3">
        {pendingOrders.length === 0 ? (
          <div className="text-center text-slate-400 mt-20">
            <p className="text-4xl mb-3">✅</p>
            <p>ไม่มีออเดอร์ค้างอยู่</p>
          </div>
        ) : (
          pendingOrders.map(order => (
            <OrderCard key={order.id} order={order} />
          ))
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Verify kitchen page manually**

```bash
# Open two tabs:
# Tab 1: http://localhost:3000/kitchen
# Tab 2: http://localhost:3000/menu?token=tok_table_1_xxxxxxxxxxxxxxxxx
# Place an order in Tab 2
# Expect: order appears in Tab 1 with a ding sound
```

- [ ] **Step 6: Commit**

```bash
git add app/kitchen/ components/kitchen/
git commit -m "feat: kitchen display with realtime order feed and sound alert"
```

---

## Task 7: Admin Auth + Dashboard

**Files:**
- Create: `app/login/page.tsx`
- Create: `app/admin/layout.tsx`
- Create: `app/admin/page.tsx`
- Create: `app/admin/AdminDashboardClient.tsx`
- Create: `components/admin/TableGrid.tsx`
- Create: `components/admin/NotificationBanner.tsx`
- Create: `components/admin/BillModal.tsx`

- [ ] **Step 1: Create `app/login/page.tsx`**

```typescript
'use client'
import { useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = getSupabaseBrowserClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
      setLoading(false)
    } else {
      router.push('/admin')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-4xl mb-2">🍽️</p>
          <h1 className="text-2xl font-bold text-gray-900">Staff Login</h1>
          <p className="text-gray-500 text-sm">สำหรับพนักงานและผู้ดูแลระบบ</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold disabled:opacity-50 hover:bg-orange-600 transition-colors"
          >
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

> Create a staff user in Supabase Dashboard → Authentication → Users → Add User, then manually insert into `staff` table: `INSERT INTO staff (id, name, role) VALUES ('<auth-user-uuid>', 'Admin', 'admin');`

- [ ] **Step 2: Create `app/admin/layout.tsx`**

```typescript
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-slate-800 text-white px-4 py-3 flex justify-between items-center">
        <h1 className="font-bold">🍽️ Admin Panel</h1>
        <div className="flex gap-4 text-sm">
          <a href="/admin" className="hover:text-orange-300">Dashboard</a>
          <a href="/admin/menu" className="hover:text-orange-300">Menu</a>
          <a href="/admin/tables" className="hover:text-orange-300">Tables</a>
        </div>
      </nav>
      {children}
    </div>
  )
}
```

- [ ] **Step 3: Create `components/admin/TableGrid.tsx`**

```typescript
'use client'
import { Table } from '@/types/database'
import { cn } from '@/lib/utils'

interface Props {
  tables: Table[]
  onTableClick: (table: Table) => void
}

const STATUS_STYLE: Record<string, string> = {
  available:      'bg-green-100 text-green-700',
  occupied:       'bg-yellow-50 text-yellow-700 border-2 border-yellow-300',
  bill_requested: 'bg-pink-100 text-pink-700 border-2 border-pink-400',
}

const STATUS_LABEL: Record<string, string> = {
  available:      'ว่าง',
  occupied:       'กำลังสั่ง',
  bill_requested: '🧾 บิล',
}

export function TableGrid({ tables, onTableClick }: Props) {
  return (
    <div>
      {/* Legend */}
      <div className="flex gap-4 flex-wrap text-xs mb-3 text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-green-100 inline-block" /> ว่าง
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-yellow-50 border border-yellow-300 inline-block" /> กำลังสั่ง
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-pink-100 border border-pink-400 inline-block" /> รอเช็คบิล
        </span>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
        {tables.map(table => (
          <button
            key={table.id}
            onClick={() => onTableClick(table)}
            className={cn(
              'rounded-xl p-3 text-center transition-transform hover:scale-105 cursor-pointer',
              STATUS_STYLE[table.status]
            )}
          >
            <div className="text-2xl font-bold">{table.number}</div>
            <div className="text-xs mt-1">{STATUS_LABEL[table.status]}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create `components/admin/NotificationBanner.tsx`**

```typescript
'use client'
import { Notification } from '@/types/database'

interface Props {
  notifications: Notification[]
  onDismiss: (id: string) => void
}

const TYPE_STYLE: Record<string, string> = {
  call_staff:   'bg-yellow-100 text-yellow-800 border-yellow-300',
  bill_request: 'bg-pink-100 text-pink-800 border-pink-300',
}

const TYPE_LABEL: Record<string, string> = {
  call_staff:   '🙋 เรียกพนักงาน',
  bill_request: '🧾 ขอเช็คบิล',
}

interface Props {
  notifications: Notification[]
  tables: Table[]
  onDismiss: (id: string) => void
}

export function NotificationBanner({ notifications, tables, onDismiss }: Props) {
  const tableMap = Object.fromEntries(tables.map(t => [t.id, t.number]))
  const unread = notifications.filter(n => !n.is_read)
  if (!unread.length) return null

  return (
    <div className="space-y-2 mb-4">
      {unread.map(n => (
        <div
          key={n.id}
          className={`flex items-center justify-between px-4 py-2 rounded-lg border text-sm ${TYPE_STYLE[n.type] ?? 'bg-gray-100'}`}
        >
          <span className="font-medium">
            {TYPE_LABEL[n.type]} — โต๊ะ {tableMap[n.table_id] ?? '?'}
          </span>
          <button
            onClick={() => onDismiss(n.id)}
            className="ml-4 opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 5: Create `components/admin/BillModal.tsx`**

```typescript
'use client'
import { useEffect, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { Table, Order, OrderItem, MenuItem } from '@/types/database'
import { formatPrice } from '@/lib/utils'

type OrderWithItems = Order & {
  order_items: (OrderItem & { menu_items: MenuItem })[]
}

interface Props {
  table: Table
  onClose: () => void
  onBillClosed: () => void
}

export function BillModal({ table, onClose, onBillClosed }: Props) {
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    supabase
      .from('sessions')
      .select('id')
      .eq('table_id', table.id)
      .eq('status', 'active')
      .single()
      .then(({ data: session }) => {
        if (!session) return
        supabase
          .from('orders')
          .select('*, order_items(*, menu_items(*))')
          .eq('session_id', session.id)
          .order('round')
          .then(({ data }) => setOrders((data as OrderWithItems[]) ?? []))
      })
  }, [table.id])

  const total = orders.reduce((sum, order) =>
    sum + order.order_items.reduce((s, item) =>
      s + item.unit_price * item.quantity, 0
    ), 0
  )

  async function handleClose() {
    setClosing(true)
    const supabase = getSupabaseBrowserClient()

    // Close session
    const { data: session } = await supabase
      .from('sessions')
      .select('id')
      .eq('table_id', table.id)
      .eq('status', 'active')
      .single()

    if (session) {
      await supabase
        .from('sessions')
        .update({ status: 'closed', ended_at: new Date().toISOString() })
        .eq('id', session.id)
    }

    // Reset table status
    await supabase
      .from('tables')
      .update({ status: 'available' })
      .eq('id', table.id)

    onBillClosed()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[85vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-bold">โต๊ะ {table.number} — สรุปบิล</h2>
          <button onClick={onClose} className="text-gray-400 text-2xl">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {orders.map(order => (
            <div key={order.id}>
              <p className="text-xs text-gray-400 font-semibold uppercase mb-2">
                รอบที่ {order.round}
              </p>
              {order.order_items.map(item => (
                <div key={item.id} className="flex justify-between text-sm py-1">
                  <span>{item.menu_items.name_th} × {item.quantity}</span>
                  <span>{formatPrice(item.unit_price * item.quantity)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="p-4 border-t space-y-3">
          <div className="flex justify-between font-bold text-xl">
            <span>รวมทั้งหมด</span>
            <span className="text-orange-500">{formatPrice(total)}</span>
          </div>
          <button
            onClick={handleClose}
            disabled={closing}
            className="w-full bg-green-500 text-white py-3 rounded-xl font-bold text-lg disabled:opacity-50 hover:bg-green-600 transition-colors"
          >
            {closing ? 'กำลังปิดบิล...' : '✓ ปิดบิล — โต๊ะว่างแล้ว'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Create `app/admin/page.tsx` and `AdminDashboardClient.tsx`**

Create `app/admin/page.tsx`:
```typescript
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { AdminDashboardClient } from './AdminDashboardClient'

export default async function AdminPage() {
  const supabase = await getSupabaseServerClient()

  const { data: tables } = await supabase
    .from('tables')
    .select('*')
    .order('number')

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('is_read', false)
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <AdminDashboardClient
      initialTables={tables ?? []}
      initialNotifications={notifications ?? []}
    />
  )
}
```

Create `app/admin/AdminDashboardClient.tsx`:
```typescript
'use client'
import { useState, useCallback } from 'react'
import { Table, Notification } from '@/types/database'
import { TableGrid } from '@/components/admin/TableGrid'
import { NotificationBanner } from '@/components/admin/NotificationBanner'
import { BillModal } from '@/components/admin/BillModal'
import { useAdminNotifications } from '@/lib/realtime/hooks'
import { useSoundAlert } from '@/components/shared/SoundAlert'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

interface Props {
  initialTables: Table[]
  initialNotifications: Notification[]
}

export function AdminDashboardClient({ initialTables, initialNotifications }: Props) {
  const [tables, setTables] = useState(initialTables)
  const [notifications, setNotifications] = useState(initialNotifications)
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const { playDing } = useSoundAlert()

  const handleNewNotification = useCallback(async (n: Notification) => {
    playDing()
    setNotifications(prev => [n, ...prev])
    // Refresh tables to pick up status changes

    // Refresh table status
    const supabase = getSupabaseBrowserClient()
    const { data } = await supabase.from('tables').select('*').order('number')
    if (data) setTables(data)
  }, [playDing])

  useAdminNotifications(handleNewNotification)

  async function dismissNotification(id: string) {
    const supabase = getSupabaseBrowserClient()
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  function handleBillClosed() {
    setSelectedTable(null)
    const supabase = getSupabaseBrowserClient()
    supabase.from('tables').select('*').order('number')
      .then(({ data }) => { if (data) setTables(data) })
  }

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h2 className="text-xl font-bold text-gray-800 mb-4">ภาพรวมโต๊ะ</h2>

      <NotificationBanner
        notifications={notifications}
        tables={tables}
        onDismiss={dismissNotification}
      />

      <TableGrid
        tables={tables}
        onTableClick={setSelectedTable}
      />

      {selectedTable && (
        <BillModal
          table={selectedTable}
          onClose={() => setSelectedTable(null)}
          onBillClosed={handleBillClosed}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 7: Verify admin dashboard manually**

```bash
# 1. Create staff user in Supabase Auth Dashboard
# 2. Open: http://localhost:3000/login
# 3. Login with staff credentials
# 4. Should redirect to /admin with table grid
# 5. Place an order from /menu?token=... in another tab
# 6. Admin should hear ding and see notification banner
```

- [ ] **Step 8: Commit**

```bash
git add app/admin/ app/login/ components/admin/
git commit -m "feat: admin dashboard with realtime notifications, table grid, bill processing"
```

---

## Task 8: Admin Menu Management

**Files:**
- Create: `app/admin/menu/page.tsx`
- Create: `app/admin/menu/MenuManagementClient.tsx`
- Create: `components/admin/MenuForm.tsx`

- [ ] **Step 1: Create `components/admin/MenuForm.tsx`**

```typescript
'use client'
import { useState } from 'react'
import { MenuItem, MenuCategory } from '@/types/database'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

interface Props {
  categories: MenuCategory[]
  item?: MenuItem
  onSaved: () => void
  onCancel: () => void
}

export function MenuForm({ categories, item, onSaved, onCancel }: Props) {
  const [form, setForm] = useState({
    category_id: item?.category_id ?? categories[0]?.id ?? '',
    name_th: item?.name_th ?? '',
    name_en: item?.name_en ?? '',
    description_th: item?.description_th ?? '',
    description_en: item?.description_en ?? '',
    price: item?.price?.toString() ?? '',
    is_available: item?.is_available ?? true,
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const supabase = getSupabaseBrowserClient()
    let image_url = item?.image_url ?? null

    // Upload image if provided
    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const path = `menu/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(path, imageFile, { upsert: true })

      if (uploadError) {
        setError('อัปโหลดรูปไม่สำเร็จ: ' + uploadError.message)
        setSaving(false)
        return
      }

      const { data: urlData } = supabase.storage
        .from('menu-images')
        .getPublicUrl(path)
      image_url = urlData.publicUrl
    }

    const payload = {
      category_id: form.category_id,
      name_th: form.name_th,
      name_en: form.name_en,
      description_th: form.description_th || null,
      description_en: form.description_en || null,
      price: parseFloat(form.price),
      is_available: form.is_available,
      image_url,
    }

    const query = item
      ? supabase.from('menu_items').update(payload).eq('id', item.id)
      : supabase.from('menu_items').insert(payload)

    const { error: dbError } = await query
    if (dbError) {
      setError(dbError.message)
    } else {
      onSaved()
    }
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">ชื่อ (ไทย)</label>
          <input
            value={form.name_th}
            onChange={e => setForm(f => ({ ...f, name_th: e.target.value }))}
            required
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Name (English)</label>
          <input
            value={form.name_en}
            onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))}
            required
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">หมวดหมู่</label>
        <select
          value={form.category_id}
          onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name_th}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">ราคา (บาท)</label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={form.price}
          onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
          required
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">รูปภาพ</label>
        <input
          type="file"
          accept="image/*"
          onChange={e => setImageFile(e.target.files?.[0] ?? null)}
          className="w-full text-sm"
        />
        {item?.image_url && !imageFile && (
          <p className="text-xs text-gray-400 mt-1">มีรูปอยู่แล้ว (เลือกใหม่เพื่อเปลี่ยน)</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="available"
          checked={form.is_available}
          onChange={e => setForm(f => ({ ...f, is_available: e.target.checked }))}
        />
        <label htmlFor="available" className="text-sm">พร้อมเสิร์ฟ (is_available)</label>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex gap-3 justify-end">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">
          ยกเลิก
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg disabled:opacity-50 hover:bg-orange-600"
        >
          {saving ? 'กำลังบันทึก...' : item ? 'บันทึก' : 'เพิ่มเมนู'}
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Create `app/admin/menu/page.tsx`**

```typescript
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { MenuManagementClient } from './MenuManagementClient'

export default async function AdminMenuPage() {
  const supabase = await getSupabaseServerClient()

  const { data: categories } = await supabase
    .from('menu_categories')
    .select('*')
    .order('sort_order')

  const { data: items } = await supabase
    .from('menu_items')
    .select('*, menu_categories(name_th)')
    .order('sort_order')

  return (
    <MenuManagementClient
      initialCategories={categories ?? []}
      initialItems={items ?? []}
    />
  )
}
```

- [ ] **Step 3: Create `app/admin/menu/MenuManagementClient.tsx`**

```typescript
'use client'
import { useState } from 'react'
import { MenuItem, MenuCategory } from '@/types/database'
import { MenuForm } from '@/components/admin/MenuForm'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { formatPrice } from '@/lib/utils'
import Image from 'next/image'

interface Props {
  initialCategories: MenuCategory[]
  initialItems: any[]
}

export function MenuManagementClient({ initialCategories, initialItems }: Props) {
  const [items, setItems] = useState(initialItems)
  const [categories] = useState(initialCategories)
  const [editingItem, setEditingItem] = useState<MenuItem | null | 'new'>(null)

  async function refresh() {
    const supabase = getSupabaseBrowserClient()
    const { data } = await supabase
      .from('menu_items')
      .select('*, menu_categories(name_th)')
      .order('sort_order')
    setItems(data ?? [])
    setEditingItem(null)
  }

  async function toggleAvailable(item: MenuItem) {
    const supabase = getSupabaseBrowserClient()
    await supabase
      .from('menu_items')
      .update({ is_available: !item.is_available })
      .eq('id', item.id)
    setItems(prev => prev.map(i =>
      i.id === item.id ? { ...i, is_available: !item.is_available } : i
    ))
  }

  async function deleteItem(id: string) {
    if (!confirm('ลบเมนูนี้ใช่ไหม?')) return
    const supabase = getSupabaseBrowserClient()
    await supabase.from('menu_items').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">จัดการเมนู</h2>
        <button
          onClick={() => setEditingItem('new')}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600"
        >
          + เพิ่มเมนู
        </button>
      </div>

      {editingItem !== null && (
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <h3 className="font-bold mb-4">
            {editingItem === 'new' ? 'เพิ่มเมนูใหม่' : `แก้ไข: ${(editingItem as MenuItem).name_th}`}
          </h3>
          <MenuForm
            categories={categories}
            item={editingItem === 'new' ? undefined : editingItem as MenuItem}
            onSaved={refresh}
            onCancel={() => setEditingItem(null)}
          />
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">รายการ</th>
              <th className="px-4 py-3 text-left">หมวดหมู่</th>
              <th className="px-4 py-3 text-right">ราคา</th>
              <th className="px-4 py-3 text-center">พร้อมเสิร์ฟ</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map(item => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {item.image_url && (
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                        <Image src={item.image_url} alt={item.name_th} fill className="object-cover" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{item.name_th}</p>
                      <p className="text-gray-400 text-xs">{item.name_en}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500">{item.menu_categories?.name_th}</td>
                <td className="px-4 py-3 text-right font-medium">{formatPrice(item.price)}</td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => toggleAvailable(item)}
                    className={`text-xs px-2 py-1 rounded-full ${
                      item.is_available
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {item.is_available ? '✓ พร้อม' : '✗ หมด'}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setEditingItem(item)}
                    className="text-blue-500 text-xs mr-3 hover:underline"
                  >
                    แก้ไข
                  </button>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="text-red-400 text-xs hover:underline"
                  >
                    ลบ
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 3b: Create Supabase Storage bucket**

In Supabase Dashboard → Storage → New Bucket:
- Name: `menu-images`
- Public: ✓ (enable public access)
- Click Create

Without this step, image uploads in the MenuForm will fail with a "bucket not found" error.

- [ ] **Step 4: Verify menu management**

```bash
# Open: http://localhost:3000/admin/menu
# 1. Add a new menu item with Thai/English name + price
# 2. Upload an image
# 3. Toggle is_available
# 4. Verify item appears in /menu?token=... page
```

- [ ] **Step 5: Commit**

```bash
git add app/admin/menu/ components/admin/MenuForm.tsx
git commit -m "feat: admin menu management — CRUD items with image upload"
```

---

## Task 9: Admin Tables & QR Generation

**Files:**
- Create: `app/admin/tables/page.tsx`
- Create: `app/admin/tables/TablesClient.tsx`

- [ ] **Step 1: Create `app/admin/tables/page.tsx`**

```typescript
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { TablesClient } from './TablesClient'

export default async function AdminTablesPage() {
  const supabase = await getSupabaseServerClient()
  const { data: tables } = await supabase
    .from('tables')
    .select('*')
    .order('number')

  return <TablesClient initialTables={tables ?? []} />
}
```

- [ ] **Step 2: Create `app/admin/tables/TablesClient.tsx`**

```typescript
'use client'
import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Table } from '@/types/database'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { nanoid } from 'nanoid'

interface Props {
  initialTables: Table[]
}

export function TablesClient({ initialTables }: Props) {
  const [tables, setTables] = useState(initialTables)
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [addingCount, setAddingCount] = useState(1)
  const [adding, setAdding] = useState(false)

  const baseUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/menu`
    : ''

  async function addTables() {
    setAdding(true)
    const supabase = getSupabaseBrowserClient()
    const maxNumber = tables.length ? Math.max(...tables.map(t => t.number)) : 0
    const newTables = Array.from({ length: addingCount }, (_, i) => ({
      number: maxNumber + i + 1,
      qr_token: nanoid(21),
    }))

    const { data } = await supabase
      .from('tables')
      .insert(newTables)
      .select()

    if (data) setTables(prev => [...prev, ...data])
    setAdding(false)
  }

  function downloadQR(table: Table) {
    const svg = document.getElementById(`qr-${table.id}`)
    if (!svg) return
    const svgData = new XMLSerializer().serializeToString(svg)
    const blob = new Blob([svgData], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `table-${table.number}-qr.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">จัดการโต๊ะ</h2>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            min="1"
            max="20"
            value={addingCount}
            onChange={e => setAddingCount(parseInt(e.target.value) || 1)}
            className="w-16 border rounded-lg px-2 py-1.5 text-sm"
          />
          <button
            onClick={addTables}
            disabled={adding}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
          >
            + เพิ่มโต๊ะ
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {tables.map(table => (
          <div
            key={table.id}
            className="bg-white rounded-xl shadow-sm p-4 text-center cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelectedTable(table)}
          >
            <p className="text-2xl font-bold text-gray-700 mb-2">โต๊ะ {table.number}</p>
            <QRCodeSVG
              id={`qr-${table.id}`}
              value={`${baseUrl}?token=${table.qr_token}`}
              size={120}
              className="mx-auto"
            />
            <button
              onClick={(e) => { e.stopPropagation(); downloadQR(table) }}
              className="mt-3 text-xs text-orange-500 hover:underline"
            >
              ⬇ ดาวน์โหลด QR
            </button>
          </div>
        ))}
      </div>

      {selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedTable(null)} />
          <div className="relative bg-white rounded-2xl p-8 text-center">
            <h3 className="text-xl font-bold mb-4">โต๊ะ {selectedTable.number}</h3>
            <QRCodeSVG
              id={`qr-modal-${selectedTable.id}`}
              value={`${baseUrl}?token=${selectedTable.qr_token}`}
              size={200}
              className="mx-auto"
            />
            <p className="text-xs text-gray-400 mt-3 break-all max-w-xs">
              {baseUrl}?token={selectedTable.qr_token}
            </p>
            <div className="flex gap-3 mt-4 justify-center">
              <button
                onClick={() => downloadQR(selectedTable)}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm"
              >
                ⬇ ดาวน์โหลด SVG
              </button>
              <button
                onClick={() => setSelectedTable(null)}
                className="border px-4 py-2 rounded-lg text-sm"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Verify QR generation**

```bash
# Open: http://localhost:3000/admin/tables
# 1. Add 3 tables
# 2. Click "ดาวน์โหลด QR" for table 1
# 3. Open downloaded SVG in browser — verify URL in QR
# 4. Scan QR with phone — should open /menu?token=...
```

- [ ] **Step 4: Commit**

```bash
git add app/admin/tables/
git commit -m "feat: admin table management with QR code generation and download"
```

---

## Task 10: Root Layout, Root Page & Final Polish

**Files:**
- Modify: `app/layout.tsx`
- Create: `app/page.tsx`
- Modify: `app/globals.css` (Tailwind scrollbar-hide)

- [ ] **Step 1: Update `app/layout.tsx`**

```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Restaurant Order',
  description: 'QR code ordering system',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

- [ ] **Step 2: Create `app/page.tsx`**

```typescript
import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/admin')
}
```

- [ ] **Step 3: Add scrollbar-hide to Tailwind**

In `tailwind.config.ts`, add plugin:
```typescript
import type { Config } from 'tailwindcss'
import plugin from 'tailwindcss/plugin'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [
    plugin(function({ addUtilities }) {
      addUtilities({
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        },
      })
    }),
  ],
}
export default config
```

- [ ] **Step 4: Run all tests**

```bash
npm run test:run
```
Expected: All tests pass.

- [ ] **Step 5: Build check**

```bash
npm run build
```
Expected: Build completes without errors. Fix any TypeScript errors.

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat: root layout, root redirect, scrollbar utility — complete QR ordering system"
```

---

## Task 11: Deploy to Vercel

- [ ] **Step 1: Push to GitHub**

```bash
# Create repo at github.com, then:
git remote add origin https://github.com/<your-username>/restaurant-qr-ordering.git
git push -u origin main
```

- [ ] **Step 2: Import to Vercel**

1. Go to vercel.com → New Project → Import from GitHub
2. Select `restaurant-qr-ordering`
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy

- [ ] **Step 3: Update QR base URL**

After deploy, get your Vercel URL (e.g. `https://restaurant-qr-ordering.vercel.app`).
QR codes in `/admin/tables` will automatically use the current `window.location.origin`, so they'll generate correct URLs in production.

- [ ] **Step 4: Smoke test production**

1. Open `https://your-app.vercel.app/admin/tables`
2. Download QR for table 1
3. Scan with phone — verify menu loads
4. Place test order — verify kitchen display shows it

---

## End-to-End Verification Checklist

```
Customer flow:
  [ ] Scan QR → /menu?token=... loads with correct table number
  [ ] All menu items show with TH/EN names, price, image (if any)
  [ ] Category tabs filter items correctly
  [ ] Add items to cart → floating cart button shows count + total
  [ ] Open cart → adjust qty → submit → success message
  [ ] "สั่งเพิ่ม" works (new cart for same session)
  [ ] "เรียกพนักงาน" sends call_staff notification
  [ ] "เช็คบิล" shows all rounds summary → confirm sends bill_request

Kitchen flow:
  [ ] /kitchen loads with pending orders
  [ ] New order appears in <2 seconds with ding sound
  [ ] Timer badge shows correct elapsed time with color
  [ ] Mark item done → struck through immediately

Admin flow:
  [ ] /login → auth → /admin redirect
  [ ] Table grid shows correct status colors
  [ ] Ding + banner on call_staff and bill_request
  [ ] Click table → BillModal shows full session summary + total
  [ ] Close bill → table turns green (available)
  [ ] /admin/menu → add item → appears in /menu immediately
  [ ] /admin/tables → add table → QR downloads and scans correctly
```

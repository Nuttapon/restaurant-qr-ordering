<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Restaurant QR Ordering System — Agent Context

## Project Overview

A restaurant QR ordering system. Customers scan a QR code at their table → web browser opens → browse menu → place orders (multiple rounds) → request bill. No app install required.

Three surfaces:
- `/menu?token=[qr_token]` — Customer ordering (public, no auth)
- `/kitchen` — Kitchen display (public, no auth, tablet in kitchen) — **NOT YET BUILT**
- `/admin` — Admin dashboard (Supabase Auth required) — **NOT YET BUILT**

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.2.1 |
| Language | TypeScript | latest |
| Styling | Tailwind CSS v4 | latest |
| Database | Supabase (PostgreSQL) | — |
| Realtime | Supabase Realtime (postgres_changes CDC) | — |
| Auth | Supabase Auth | — |
| File Storage | Supabase Storage | — |
| State | Zustand | — |
| Testing | vitest + @testing-library/react | — |
| QR Generation | qrcode.react | — |
| QR Tokens | nanoid | — |
| Deployment | Vercel | — |

---

## What Is Already Built

### Database (Supabase — run migrations in order via SQL Editor)

`supabase/migrations/001_schema.sql` — All tables, enums, triggers
`supabase/migrations/002_rls.sql` — Row-Level Security policies
`supabase/migrations/003_rpc.sql` — Two SECURITY DEFINER RPC functions
`supabase/migrations/004_seed.sql` — 10 dev tables (tok_dev_table_01_… to _10_…), 3 categories, 6 menu items

After running migrations, manually enable Realtime on `notifications` and `order_items` tables in Supabase dashboard → Table Editor → Realtime toggle.

Create a Storage bucket named `menu-images` (Public) for food photos.

### Source Files Built

```
app/
  menu/page.tsx          Server Component — validates QR token, fetches menu, calls get_or_create_session
  menu/MenuPageClient.tsx Client shell — category filter, menu list, cart, post-order actions
  api/orders/route.ts    POST — creates order + order_items + new_order notification
  api/notifications/route.ts  POST — call_staff / bill_request notifications
  layout.tsx             Root layout (Geist font, Tailwind)
  page.tsx               Default Next.js scaffold (needs replacing with redirect)

components/
  shared/SoundAlert.tsx           useSoundAlert() hook — Web Audio API ding, no MP3 needed
  customer/CategoryTabs.tsx       Horizontal scrollable category filter
  customer/MenuItemCard.tsx       Menu item card with add-to-cart
  customer/CartDrawer.tsx         Slide-up cart drawer, submits to /api/orders
  customer/OrderSummary.tsx       Post-order modal: order history, call staff, 2-step bill flow

lib/
  supabase/client.ts     getSupabaseBrowserClient() singleton
  supabase/server.ts     getSupabaseServerClient() async (uses next/headers cookies)
  realtime/hooks.ts      useKitchenNotifications, useAdminNotifications, useOrderItemUpdates
  utils.ts               formatPrice(price), timeAgo(date), cn(...classes)

store/
  cart.ts                Zustand store — items, addItem, removeItem, updateQuantity, clearCart, totalPrice

middleware.ts            Protects /admin/:path* — redirects to /login if no Supabase auth user

types/database.ts        TypeScript types: Table, Session, MenuCategory, MenuItem, Order, OrderItem,
                         Notification, Staff + their status enums
```

### Test Files

```
lib/__tests__/utils.test.ts     3 tests — formatPrice, cn
store/__tests__/cart.test.ts    6 tests — addItem, increment on duplicate, remove at 0, totalPrice
```

Run tests: `npm run test` (vitest watch) or `npm run test:run` (CI)

---

## What Is NOT Yet Built

The following tasks remain from the implementation plan (`docs/superpowers/plans/2026-03-22-restaurant-qr-ordering.md`):

| Task | Surface | Key Files |
|------|---------|-----------|
| **Task 5 (partial)** | Customer page — spec compliance fixes pending | See Known Issues below |
| **Task 6** | Kitchen Display `/kitchen` | `app/kitchen/page.tsx`, `components/kitchen/OrderCard.tsx`, `components/kitchen/TimerBadge.tsx` |
| **Task 7** | Admin Auth + Dashboard `/admin` | `app/login/page.tsx`, `app/admin/layout.tsx`, `app/admin/page.tsx`, `components/admin/TableGrid.tsx`, `components/admin/NotificationBanner.tsx`, `components/admin/BillModal.tsx` |
| **Task 8** | Admin Menu Management `/admin/menu` | `app/admin/menu/page.tsx`, `components/admin/MenuForm.tsx` (image upload to Supabase Storage) |
| **Task 9** | Admin Tables + QR Generation `/admin/tables` | `app/admin/tables/page.tsx` (qrcode.react, download QR as PNG) |
| **Task 10** | Root Layout + Polish + Build Check | `app/layout.tsx` update, `app/page.tsx` redirect, global CSS, scrollbar-hide utility |
| **Task 11** | Deploy to Vercel | Vercel project setup, env vars, domain |

---

## Known Issues / Tech Debt (Fix Before Shipping)

### Critical

**C1 — API routes lack server-side ownership verification**
`app/api/orders/route.ts` and `app/api/notifications/route.ts` accept `sessionId`/`tableId` from the request body at face value. A malicious client can:
- Forge orders for other tables
- Submit arbitrary `unitPrice` values (price should be re-fetched from `menu_items` on server)
- Trigger `bill_request` for any table

Fix: In `POST /api/orders`, join `sessions` to verify `session.id = sessionId AND session.table_id = tableId AND session.status = 'active'`, and re-fetch item prices from `menu_items` rather than trusting client-supplied `unitPrice`.

**C2 — `handleConfirmBill` in `OrderSummary.tsx` silently ignores HTTP errors**
`components/customer/OrderSummary.tsx` ~line 82. The `fetch` response is never checked; UI shows "แจ้งเรียบร้อยแล้ว" even if the server returned 500. Fix: check `res.ok` and show an error state.

### Important

**I2 — Duplicate `handleCallStaff` logic**
Both `MenuPageClient.tsx` and `OrderSummary.tsx` implement separate call-staff fetch calls with divergent UX (one auto-resets, one doesn't). Consider extracting to a shared hook or passing a callback down.

**I3 — RPC result in OrderSummary cast without validation**
`supabase.rpc('get_session_summary')` result is cast via `data as OrderDetail[]` with no shape validation. Supabase errors are silently discarded. Add error state rendering.

**M4 — Round count race condition in `/api/orders`**
Two concurrent order submissions from the same session will both read the same `count` and receive the same `round` number. Low probability in practice, but move round calculation to a DB function for correctness.

**M5 — setTimeout without cleanup in MenuPageClient**
`setTimeout` calls for `callStaffSuccess` reset (3 s) and `callStaffError` clear (4 s) are not cancelled on unmount. Store IDs in `useRef` and call `clearTimeout` in a `useEffect` cleanup.

---

## Database Schema

### Tables

```
tables          id, number (int UNIQUE), status (available|occupied|bill_requested), qr_token (text UNIQUE), updated_at
sessions        id, table_id FK, started_at, ended_at nullable, status (active|closed), closed_by FK→staff nullable, updated_at
menu_categories id, name_th, name_en, sort_order, is_active, updated_at
menu_items      id, category_id FK, name_th, name_en, description_th nullable, description_en nullable, price numeric(10,2), image_url nullable, is_available, sort_order, updated_at
orders          id, session_id FK, table_id FK (denormalized), round int, status (pending|confirmed|done|cancelled), created_at, updated_at
order_items     id, order_id FK, menu_item_id FK, quantity int CHECK>0, unit_price numeric(10,2) (snapshot at order time), note nullable, status (pending|cooking|done), updated_at
notifications   id, table_id FK, type (new_order|call_staff|bill_request), order_id nullable FK, is_read bool default false, created_at
staff           id (= auth.users.id), name, role (admin|staff|kitchen)
```

### Critical Constraints

- `sessions_one_active_per_table`: partial unique index on `sessions(table_id) WHERE status = 'active'` — enforces max 1 active session per table
- All tables have `updated_at` with auto-update trigger `trigger_set_updated_at()`
- FK performance indexes on all foreign key columns

### RPC Functions (SECURITY DEFINER, granted to `anon`)

**`get_or_create_session(p_qr_token TEXT) → json`**
- Uses `SELECT ... FOR UPDATE` to prevent race conditions under concurrent QR scans
- Returns `{ session: {...}, table: {...} }`
- Only updates `table.status` to `'occupied'` if currently `'available'` (won't overwrite `'bill_requested'`)
- Re-fetches table after UPDATE to return fresh status

**`get_session_summary(p_session_id uuid, p_qr_token TEXT) → json`**
- Validates QR token AND that the session belongs to that table (ownership check)
- Returns array of orders with nested order_items and menu_item details
- Used by customer `OrderSummary` to avoid needing anon SELECT on orders table (which would expose all orders)

### RLS Summary

| Table | anon | authenticated |
|-------|------|---------------|
| `tables` | SELECT | SELECT + UPDATE |
| `menu_categories` | SELECT (is_active=true) | Full CRUD |
| `menu_items` | SELECT (is_available=true) | Full CRUD |
| `sessions` | None (RPC only) | SELECT + UPDATE |
| `orders` | INSERT only | SELECT + UPDATE |
| `order_items` | INSERT only | SELECT + UPDATE |
| `notifications` | INSERT only | SELECT + UPDATE |
| `staff` | None | SELECT own profile |

**Do NOT add anon SELECT to sessions, orders, or order_items** — this would expose all customers' orders to any anonymous client. Order reading is handled by `get_session_summary` RPC which validates ownership.

---

## Realtime

### How It Works

`INSERT` into `notifications` table → Supabase Realtime broadcasts to all subscribers → Kitchen/Admin browser plays sound via Web Audio API.

### Hooks (`lib/realtime/hooks.ts`)

- `useKitchenNotifications(onNew)` — subscribes to `notifications` INSERTs filtered `type=eq.new_order`
- `useAdminNotifications(onNew)` — subscribes to all `notifications` INSERTs, client-side filters `call_staff` / `bill_request`
- `useOrderItemUpdates(orderId, onUpdate)` — subscribes to `order_items` UPDATEs for a specific order

### Sound Alert (`components/shared/SoundAlert.tsx`)

```typescript
import { useSoundAlert } from '@/components/shared/SoundAlert'
const { playDing } = useSoundAlert()
// call playDing() on new notification event
```

Uses Web Audio API — no MP3 file needed. Handles `AudioContext` suspended state (browser autoplay policy) by calling `ctx.resume()` before scheduling the oscillator. The hook is `'use client'` only.

---

## Supabase Client Usage

**Browser (Client Components):**
```typescript
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
const supabase = getSupabaseBrowserClient()
```

**Server (Server Components, API Routes, middleware):**
```typescript
import { getSupabaseServerClient } from '@/lib/supabase/server'
const supabase = await getSupabaseServerClient()
```

Never use `createClient` directly — always go through these wrappers.

---

## Auth

Staff login uses Supabase Auth. Middleware at `middleware.ts` guards all `/admin/:path*` routes — redirects to `/login` if no authenticated user.

Kitchen `/kitchen` is intentionally public (no auth). Intended to run on a dedicated tablet on the restaurant's internal WiFi.

Login page at `/login` is **not yet built** (Task 7).

---

## Key Conventions

### Pricing
`price` is `numeric(10,2)` in the DB (e.g., `80.00`). JavaScript receives it as a number. Use `formatPrice(price)` from `lib/utils.ts` for display — renders as `฿80` for integers, `฿49.50` for decimals.

### Bilingual Fields
Menu items and categories have both `_th` (Thai) and `_en` (English) versions of all text fields. Both are always shown together — this is not a toggle/i18n system.

### Server vs Client Components
- Pages that need data from Supabase at load time → Server Components (`app/*/page.tsx`)
- Interactive UI (state, event handlers, realtime subscriptions) → Client Components (`'use client'`)
- Pattern: Server Component fetches data, passes typed props to a `*Client.tsx` sibling

### Image Handling
Food photos are stored in Supabase Storage bucket `menu-images` (Public). URLs stored in `menu_items.image_url`. `next/image` is configured to allow `*.supabase.co` hostnames (in `next.config.ts`). Always use `next/image` with `fill` + parent `relative overflow-hidden` container.

### Cart State
Zustand store at `store/cart.ts`. Cart is client-side only — not persisted to the DB until the customer taps "สั่งอาหาร". `updateQuantity(id, 0)` removes the item.

### QR Tokens
Each table has a permanent `qr_token` (nanoid 21 chars) that never changes. Customer URL: `/menu?token=[qr_token]`. Dev tokens follow the pattern `tok_dev_table_01_xxxxxxxxxx`.

---

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

Get from Supabase dashboard → Project Settings → API. Service role key is only used server-side.

---

## Commands

```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Production build + type check
npm run test         # vitest watch mode
npm run test:run     # vitest single run (CI)
```

---

## Design References

Full design spec: `docs/superpowers/specs/2026-03-22-restaurant-qr-ordering-design.md`
Full implementation plan: `docs/superpowers/plans/2026-03-22-restaurant-qr-ordering.md`

UI mockups (HTML): `.superpowers/brainstorm/83746-1774176728/`
- `customer-ui.html` — Customer flow (4 screens)
- `admin-kitchen-ui.html` — Kitchen board + Admin dashboard

### Kitchen Display Spec (Task 6)

- Real-time order feed sorted by `created_at ASC`
- Each card: table number, round number, list of items with Done buttons
- Done button → PATCH `order_items.status = 'done'` (needs API route or direct Supabase call with authenticated client)
- Color-coded elapsed time badge: green < 5 min, yellow 5–10 min, red > 10 min
- Sound alert on new `new_order` notification (use `useSoundAlert`)
- No auth required

### Admin Dashboard Spec (Task 7)

- Table grid: color per status — green=available, yellow=occupied, orange+border=call_staff, pink+border=bill_requested
- Notification banner: shows unread `call_staff` + `bill_request` events
- Sound alert on new admin notifications
- Click table → open `BillModal` showing full session summary + "Close Bill" button
- "Close Bill" → `sessions.status = 'closed'`, `tables.status = 'available'`, set `sessions.closed_by = auth.uid()`
- Requires authenticated Supabase client (staff is logged in)

### Admin Menu Management Spec (Task 8)

- List all menu categories + items
- Create / Edit / Delete categories and items
- Image upload: `supabase.storage.from('menu-images').upload(...)` → store public URL in `menu_items.image_url`
- Toggle `is_available` and `is_active` in-place

### Admin Tables + QR Spec (Task 9)

- List all tables
- Generate QR code using `qrcode.react` pointing to `/menu?token=[qr_token]`
- Download QR as PNG (use canvas `toDataURL` or `qrcode.react` ref)
- Create new tables (auto-generate `qr_token` with `nanoid(21)`)

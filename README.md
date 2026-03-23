# Restaurant QR Ordering System

A free, open-source QR code-based table ordering system for restaurants. Customers scan a QR code at their table, browse the menu in their browser, and place orders — no app download required. The kitchen and admin staff see everything in real-time.

**Live demo:** Deploy your own in ~15 minutes using the guide below.

---

## Features

**Customer-facing (`/menu`)**
- Scan QR code → instantly open the menu in any browser
- Browse menu by category, view photos, descriptions, and prices (Thai + English)
- Add items to cart with quantity stepper, adjust before ordering
- Place multiple rounds of orders at the same table (order more food anytime)
- Call staff with one tap
- Request the bill when ready

**Kitchen display (`/kitchen`)**
- Real-time order feed — new orders appear instantly with a sound alert
- Color-coded urgency: green (fresh) → yellow (5 min) → red (10+ min, pulsing)
- Per-item "Done" button to mark items as cooked
- Progress bar showing how many items in each order are done
- No login required — designed to run on a dedicated tablet in the kitchen

**Admin dashboard (`/admin`)**
- Table grid showing status at a glance (available / occupied / bill requested)
- Real-time notification banner: new orders 🍽️, call staff 🔔, bill requests 📋
- Click any table to see full order history and close the bill
- Menu management: add/edit/delete categories and menu items with photo upload
- Table management: create tables and generate downloadable QR codes as PNG files

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| Language | TypeScript |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| Database + Auth + Storage | [Supabase](https://supabase.com) (PostgreSQL) |
| Realtime | Supabase Realtime (postgres_changes CDC) |
| State | [Zustand](https://zustand-demo.pmnd.rs) |
| QR Generation | [qrcode.react](https://github.com/zpao/qrcode.react) |
| Deployment | [Vercel](https://vercel.com) (or any Node.js host) |

---

## Project Structure

```
restaurant-qr-ordering/
├── app/
│   ├── menu/                  # Customer ordering page
│   │   ├── page.tsx           # Server component — validates QR token, fetches menu
│   │   └── MenuPageClient.tsx # Client shell — category filter, cart, post-order actions
│   ├── kitchen/               # Kitchen display (public, no auth)
│   │   ├── page.tsx
│   │   └── KitchenClient.tsx
│   ├── admin/                 # Admin area (requires login)
│   │   ├── layout.tsx         # Auth guard — redirects to /login if not logged in
│   │   ├── page.tsx           # Dashboard
│   │   ├── AdminDashboardClient.tsx
│   │   ├── menu/              # Menu management
│   │   └── tables/            # Table + QR management
│   ├── login/                 # Staff login
│   ├── api/
│   │   ├── orders/route.ts    # POST — create order
│   │   └── notifications/route.ts  # POST — call staff / bill request
│   ├── globals.css            # Design tokens, animations
│   └── layout.tsx             # Root layout
├── components/
│   ├── customer/              # CategoryTabs, MenuItemCard, CartDrawer, OrderSummary
│   ├── admin/                 # TableGrid, NotificationBanner, BillModal, MenuForm, AdminHeaderBar
│   ├── kitchen/               # OrderCard, TimerBadge
│   └── shared/                # SoundAlert (Web Audio API)
├── lib/
│   ├── supabase/
│   │   ├── client.ts          # Browser Supabase client (singleton)
│   │   └── server.ts          # Server Supabase clients (cookie-based + service role)
│   ├── realtime/hooks.ts      # useKitchenNotifications, useAdminNotifications, useOrderItemUpdates
│   └── utils.ts               # formatPrice(), timeAgo(), cn()
├── store/
│   └── cart.ts                # Zustand cart store
├── middleware.ts               # Protects /admin/* routes
├── types/database.ts           # TypeScript types for all DB tables
└── supabase/migrations/        # All database migrations (run in order)
```

---

## Getting Started

### Prerequisites

- [Node.js 18+](https://nodejs.org)
- A [Supabase](https://supabase.com) account (free tier works)
- A [Vercel](https://vercel.com) account (free tier works) — or any Node.js host

---

### Step 1 — Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to finish provisioning (~1 minute)
3. Note your project URL and API keys — you'll need them in Step 3

---

### Step 2 — Run Database Migrations

Go to your Supabase project → **SQL Editor** and run each file below **in order**. Paste the full contents of each file and click **Run**.

| Order | File | What it does |
|-------|------|-------------|
| 1 | `supabase/migrations/20260323000001_schema.sql` | Creates all tables, enums, triggers |
| 2 | `supabase/migrations/20260323000002_rls.sql` | Row-Level Security policies |
| 3 | `supabase/migrations/20260323000003_rpc.sql` | `get_or_create_session()` and `get_session_summary()` RPC functions |
| 4 | `supabase/migrations/20260323000004_seed.sql` | 10 test tables + sample menu (dev only, skip for production) |
| 5 | `supabase/migrations/20260323000005_fix_sessions_index.sql` | Unique index for active sessions |
| 6 | `supabase/migrations/20260323000006_fix_rpc_conflict_clause.sql` | RPC conflict clause fix |
| 7 | `supabase/migrations/20260323000007_fix_tables_rls.sql` | INSERT policy for authenticated staff on tables |
| 8 | `supabase/migrations/20260323000008_storage_policies.sql` | Storage RLS policies for menu image uploads |

> **Tip:** All migrations are idempotent — safe to run multiple times without errors.

---

### Step 3 — Configure Supabase Services

**Enable Realtime** (required for live order updates and notifications):
1. Supabase Dashboard → **Database** → **Replication**
2. Enable replication for the `notifications` table
3. Enable replication for the `order_items` table

**Create a Storage bucket** (required for menu item photos):
1. Supabase Dashboard → **Storage** → **New bucket**
2. Name: `menu-images`
3. Check **Public bucket** → Save

---

### Step 4 — Create an Admin User

Staff log in with Supabase Auth (email + password). Create your first admin account:

1. Supabase Dashboard → **Authentication** → **Users** → **Add user**
2. Enter an email (e.g. `admin@yourrestaurant.com`) and a strong password
3. Copy the UUID shown for the new user
4. Go to **SQL Editor** and run:

```sql
INSERT INTO staff (id, name, role)
VALUES ('<paste-user-uuid-here>', 'Admin', 'admin');
```

> You can create multiple staff accounts the same way. Roles are `admin`, `staff`, or `kitchen`.

---

### Step 5 — Set Up Environment Variables

Create a `.env.local` file in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Find all three values in Supabase → **Project Settings** → **API**.

> ⚠️ Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser. It bypasses Row-Level Security and is only used in server-side API routes.

---

### Step 6 — Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Test the customer flow** with a seed table token:
```
http://localhost:3000/menu?token=tok_dev_table_01_xxxxxxxxxx
```

**Admin login:**
```
http://localhost:3000/login
```
Log in with the email and password you created in Step 4.

**Kitchen display** (no login required):
```
http://localhost:3000/kitchen
```

---

### Step 7 — Deploy to Vercel

1. Push the repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → import your repo
3. Add environment variables under **Settings → Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy

Your app will be live at `https://your-project.vercel.app`.

---

## Setting Up Tables and QR Codes

After deploying, create your real restaurant tables:

1. Go to `/admin/tables`
2. Click **+ เพิ่มโต๊ะ** (Add Table) and enter a table number
3. Click the **QR Code** button next to any table
4. Click **Download PNG** to save the QR code
5. Print and laminate the QR code for each table

> The QR code encodes the URL `https://your-domain.com/menu?token=<unique_token>`. Each table has a permanent token that never changes.

---

## Adding Menu Items

1. Go to `/admin/menu`
2. Create **categories** first (e.g. อาหารหลัก / Main Dishes, เครื่องดื่ม / Drinks)
3. Switch to the **Items** tab and add menu items
4. Fill in Thai and English names, price, description (optional), and upload a photo
5. Items are immediately visible to customers once saved

---

## How Ordering Works

1. Customer scans QR code → opens `/menu?token=<qr_token>`
2. A **session** is created for the table (or the existing active session is resumed)
3. Customer adds items to cart and taps **สั่งอาหาร** (Place Order)
4. An **order** is created with a round number (round 1, 2, 3...) — each "Place Order" tap is a new round
5. A notification is inserted → kitchen and admin see it instantly via Realtime
6. Kitchen marks items as done one by one
7. Customer can keep ordering more rounds
8. When ready, customer taps **ขอเช็คบิล** → admin is notified → admin closes the bill → table resets to available

---

## Database Schema

```
tables          id, number (int UNIQUE), status, qr_token, updated_at
sessions        id, table_id, started_at, ended_at, status (active|closed), closed_by
menu_categories id, name_th, name_en, sort_order, is_active, updated_at
menu_items      id, category_id, name_th, name_en, description_th, description_en,
                price, image_url, is_available, sort_order, updated_at
orders          id, session_id, table_id, round (int), status, created_at, updated_at
order_items     id, order_id, menu_item_id, quantity, unit_price, note, status, updated_at
notifications   id, table_id, type (new_order|call_staff|bill_request), order_id,
                is_read, created_at
staff           id (= auth.users.id), name, role (admin|staff|kitchen)
```

**Security model:**
- Anonymous customers can only INSERT orders, order_items, and notifications — they cannot read other tables' data
- All sensitive reads (session ownership, order history) go through `SECURITY DEFINER` RPC functions
- Admin/staff actions use Supabase Auth sessions
- Server-side API routes use the service role key to verify session ownership before accepting orders

---

## Routes Reference

| Route | Access | Description |
|-------|--------|-------------|
| `/menu?token=<qr_token>` | Public | Customer ordering page |
| `/kitchen` | Public | Kitchen display — run on a tablet in the kitchen |
| `/admin` | Staff login required | Dashboard with table grid and notifications |
| `/admin/menu` | Staff login required | Add/edit/delete menu categories and items |
| `/admin/tables` | Staff login required | Manage tables and generate/download QR codes |
| `/login` | Public | Staff login page |

---

## Customization

**Change the brand color:** Edit `app/globals.css`:
```css
:root {
  --brand-primary: #D4622B;       /* Main accent color */
  --brand-primary-hover: #BF5424; /* Hover state */
  --brand-primary-light: #F4E0D3; /* Tinted background */
}
```

**Change the restaurant name:** Update the header title in `app/menu/MenuPageClient.tsx` and `components/admin/LogoutButton.tsx`.

**Add more notification types:** The `notification_type` enum in the schema supports extension. Add new types in `supabase/migrations/`, update `lib/realtime/hooks.ts`, and handle them in `components/admin/NotificationBanner.tsx`.

**Multilingual menus:** The schema has `name_th`/`name_en` and `description_th`/`description_en` fields on every menu item. Both are shown together by default. You can adapt this for any language pair by updating the display components.

---

## Development

```bash
npm run dev        # Start dev server at http://localhost:3000
npm run build      # Production build + type check
npm run test       # Run tests in watch mode
npm run test:run   # Run tests once (CI)
npm run lint       # Lint with ESLint
```

Tests are in `lib/__tests__/` and `store/__tests__/` using Vitest + Testing Library.

---

## Common Issues

**"Table not found" when scanning a QR code**
- Make sure migrations 5 and 6 have been applied (they fix the session index and RPC conflict clause)
- Verify the QR token in the URL matches a row in the `tables` table

**"Invalid or expired session" when placing an order**
- Check that `SUPABASE_SERVICE_ROLE_KEY` is set correctly in your environment variables
- The API routes require the service role key to verify session ownership server-side

**"new row violates row-level security policy" when adding a table**
- Run migration 7 (`20260323000007_fix_tables_rls.sql`) in the SQL Editor
- Or run: `CREATE POLICY "staff insert tables" ON tables FOR INSERT TO authenticated WITH CHECK (true);`

**"Image upload failed: new row violates row-level security policy"**
- Run migration 8 (`20260323000008_storage_policies.sql`) in the SQL Editor
- Creating the bucket as "Public" only allows reads — write access requires explicit policies

**No sound alerts in kitchen/admin**
- Sound requires a user interaction first (browser autoplay policy)
- Tap anywhere on the kitchen or admin page before orders start coming in — the Web Audio context will unlock

**Admin login not working**
- Login requires a valid email address, not a username
- Make sure you've also inserted a row in the `staff` table with the user's UUID

---

## License

MIT — free to use, modify, and distribute. No attribution required.

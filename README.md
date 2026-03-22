# Restaurant QR Ordering System

QR code-based table ordering system built with Next.js 15 + Supabase.

## Setup

### 1. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run these files in order:
   - `supabase/migrations/001_schema.sql` — Creates all tables
   - `supabase/migrations/002_rls.sql` — Row-Level Security policies
   - `supabase/migrations/003_rpc.sql` — `get_or_create_session()` function
   - `supabase/migrations/004_seed.sql` — Seed test data (dev only)
3. Enable Realtime for tables `notifications` and `order_items`:
   - Dashboard → Database → Replication → enable both tables
4. Create Storage bucket `menu-images` (Public):
   - Dashboard → Storage → New Bucket → Name: `menu-images` → Public: ✓
5. Create a staff user:
   - Dashboard → Authentication → Users → Add User
   - Then in SQL Editor: `INSERT INTO staff (id, name, role) VALUES ('<user-uuid>', 'Admin', 'admin');`

### 2. Environment Variables

Copy `.env.local` and fill in your Supabase project values:
- `NEXT_PUBLIC_SUPABASE_URL` — Project URL from Settings → API
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Anon key from Settings → API
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key from Settings → API

### 3. Run Development Server

```bash
npm install
npm run dev
```

## Routes

| Route | Who | Description |
|-------|-----|-------------|
| `/menu?token=<qr_token>` | Customers | Browse menu and place orders |
| `/kitchen` | Kitchen staff | Live order feed (no login required) |
| `/admin` | Admin/Staff | Dashboard, menu management, QR codes |
| `/login` | Staff | Login page |

## Development QR Token

For local testing, use any token from `004_seed.sql`, e.g.:
`http://localhost:3000/menu?token=tok_dev_table_01_xxxxxxxxxx`

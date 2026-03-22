# Restaurant QR Ordering System — Design Spec

**Date:** 2026-03-22
**Status:** Approved

---

## Context

ร้านอาหารขนาดกลาง (15–40 โต๊ะ) ต้องการระบบสั่งอาหารผ่าน QR Code แทนการใช้เมนูกระดาษและพนักงานรับออเดอร์ ลูกค้าสแกน QR ที่โต๊ะ → เปิดเว็บ → ดูเมนู → สั่งอาหารได้เลย โดยไม่ต้องติดตั้ง app

**เป้าหมาย:**
- ลดภาระพนักงานรับออเดอร์
- ลูกค้าสั่งเพิ่มได้เองหลายรอบโดยไม่ต้องรอพนักงาน
- ครัวและ admin เห็น order realtime พร้อมเสียงแจ้งเตือน
- Admin จัดการเมนูได้ผ่าน UI โดยไม่ต้องแตะ code

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend + API | Next.js 15 (App Router) |
| Database | Supabase (PostgreSQL) |
| Realtime | Supabase Realtime (Postgres CDC) |
| Auth | Supabase Auth (staff login) |
| File Storage | Supabase Storage (food images) |
| Hosting | Vercel |
| Language | Thai + English |

---

## Architecture

```
VERCEL (Next.js 15)
├── /menu/[table]       — Customer ordering UI (public)
├── /kitchen            — Kitchen display (no auth, tablet)
├── /admin              — Admin dashboard (staff login required)
│   ├── /admin/menu     — Manage menu items & categories
│   └── /admin/tables   — Table management & QR generation
└── /api/*              — Next.js API Routes

SUPABASE
├── PostgreSQL          — All data storage
├── Realtime            — Subscribe to orders + notifications tables
├── Auth                — Staff accounts (admin / kitchen / staff roles)
└── Storage             — Menu item images (food photos)
```

**Notification flow:**
1. Customer action (order / call staff / request bill)
2. → INSERT into `notifications` table
3. → Supabase Realtime broadcasts to all subscribers
4. → Admin & Kitchen UI plays sound via Web Audio API + shows alert

---

## Database Schema

### `tables`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| number | int | โต๊ะที่ 1, 2, 3... |
| status | enum | `available`, `occupied`, `bill_requested` |
| qr_token | text unique | ไม่เปลี่ยน, ใช้ใน QR URL (`nanoid(21)`) |
| updated_at | timestamptz | auto-updated via trigger |

### `sessions`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| table_id | uuid FK → tables | UNIQUE WHERE status='active' |
| started_at | timestamptz | |
| ended_at | timestamptz nullable | |
| status | enum | `active`, `closed` |
| closed_by | uuid nullable FK → staff | staff ที่ปิดบิล |
| updated_at | timestamptz | auto-updated via trigger |

### `menu_categories`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| name_th | text | ชื่อภาษาไทย |
| name_en | text | ชื่อภาษาอังกฤษ |
| sort_order | int | ลำดับแสดงผล |
| is_active | bool | |
| updated_at | timestamptz | auto-updated via trigger |

### `menu_items`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| category_id | uuid FK → menu_categories | |
| name_th | text | |
| name_en | text | |
| description_th | text nullable | |
| description_en | text nullable | |
| price | numeric(10,2) | หน่วย: บาท รองรับทศนิยม (เช่น 49.50) |
| image_url | text nullable | Supabase Storage URL |
| is_available | bool | |
| sort_order | int | |
| updated_at | timestamptz | auto-updated via trigger |

### `orders`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| session_id | uuid FK → sessions | |
| table_id | uuid FK → tables | denormalized for easy query |
| round | int | รอบที่ 1, 2, 3... |
| status | enum | `pending`, `confirmed`, `done`, `cancelled` |
| created_at | timestamptz | |
| updated_at | timestamptz | auto-updated via trigger |

### `order_items`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| order_id | uuid FK → orders | |
| menu_item_id | uuid FK → menu_items | |
| quantity | int | |
| unit_price | numeric(10,2) | snapshot ราคา ณ เวลาสั่ง |
| note | text nullable | หมายเหตุพิเศษ |
| status | enum | `pending`, `cooking`, `done` |
| updated_at | timestamptz | auto-updated via trigger |

### `notifications`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| table_id | uuid FK → tables | |
| type | enum | `new_order`, `call_staff`, `bill_request` |
| order_id | uuid nullable FK → orders | |
| is_read | bool | default false |
| created_at | timestamptz | |

### `staff` (Supabase Auth users + profile)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK (= auth.users.id) | |
| name | text | |
| role | enum | `admin`, `staff`, `kitchen` |

---

## App Surfaces

### 1. Customer (`/menu?token=[qr_token]`)
- Public route — ไม่ต้อง login
- อ่าน table จาก `qr_token` parameter
- สร้าง session อัตโนมัติถ้ายังไม่มี active session
- **Browse**: category tabs, รูปอาหาร, ชื่อ TH/EN, ราคา
- **Cart**: เพิ่ม/ลด qty, สรุปยอด, ปุ่มสั่งอาหาร
- **Post-order**: แสดงออเดอร์ที่สั่ง, ปุ่ม "สั่งเพิ่ม" (เปิด cart ใหม่), "เรียกพนักงาน", "ขอเช็คบิล"
- **Check bill**: สรุปทุก rounds พร้อมยอดรวม → กด confirm → notify admin

### 2. Kitchen (`/kitchen`)
- Public route (ไม่ต้อง login) — เปิดค้างบน tablet ในครัว
- Real-time order feed เรียงตาม `created_at ASC`
- แต่ละ card: โต๊ะ #, รอบที่, รายการ, เวลาที่รอ
- สีเตือน: เขียว (< 5 นาที), เหลือง (5–10 นาที), แดง (> 10 นาที)
- ปุ่ม "Done" ต่อ item → update `order_items.status = 'done'`
- Web Audio API เล่นเสียงเมื่อมี `new_order` notification ใหม่

### 3. Admin (`/admin`)
- ต้อง login ด้วย Supabase Auth
- **Dashboard**: table grid overview, สี = สถานะ, alert banner
- **Notifications**: เสียงแจ้งเตือน call_staff + bill_request
- **Bill processing**: ดู order summary ทั้ง session, คลิก "Close bill" → session = closed, table = available
- **Menu management** (`/admin/menu`): CRUD menu categories + items, upload รูป
- **QR codes** (`/admin/tables`): generate + download QR code ต่อโต๊ะ

---

## Key Design Decisions

1. **Session-based ordering**: 1 session = 1 กลุ่มลูกค้า, หลาย orders (rounds) ภายใน session เดียว
2. **QR token ไม่เปลี่ยน**: พิมพ์ QR ครั้งเดียวติดโต๊ะได้เลย ไม่ต้องเปลี่ยน URL — ใช้ `nanoid(21)` generate ครั้งเดียวตอนสร้างโต๊ะ
3. **Realtime via Supabase**: subscribe `notifications` table — ไม่ต้อง polling, เสียงแจ้งใน browser, filter by type ต่อ role
4. **Kitchen ไม่ต้อง login**: เปิด `/kitchen` บน tablet ในครัวได้เลย — restrict ด้วย network (WiFi ร้านเท่านั้น) หรือ Supabase RLS
5. **Sound via Web Audio API**: เล่นเสียง "ding" ใน browser ทันทีที่ได้ realtime event
6. **No online payment**: checkbill = แจ้งพนักงาน → จ่ายที่เคาน์เตอร์
7. **Bilingual menu**: TH + EN แสดงพร้อมกันทั้ง 2 ภาษา (ไม่ใช่ toggle)
8. **Session uniqueness**: `UNIQUE` constraint บน `sessions(table_id) WHERE status = 'active'` ป้องกัน race condition — ใช้ Supabase RPC `get_or_create_session(table_id)` แทน client-side insert
9. **price เป็น `numeric(10,2)`**: รองรับทศนิยมในอนาคต (เดิมคิดว่า int แต่แก้เพื่อ flexibility)
10. **`updated_at` ทุก table**: ใช้ `DEFAULT now()` + trigger update อัตโนมัติ

---

## Security & Access Control (RLS)

### Supabase Row-Level Security Policies

| Table | Anonymous (customer) | Authenticated (staff) |
|-------|---------------------|----------------------|
| `tables` | SELECT only | SELECT + UPDATE |
| `menu_categories` | SELECT (is_active=true only) | Full CRUD |
| `menu_items` | SELECT (is_available=true only) | Full CRUD |
| `sessions` | INSERT (via RPC only), SELECT own session by qr_token | SELECT all |
| `orders` | INSERT + SELECT (own session only, verified by qr_token) | SELECT all |
| `order_items` | INSERT + SELECT (own order only) | SELECT all + UPDATE status |
| `notifications` | INSERT only (for call/bill events) | SELECT + UPDATE (is_read) |
| `staff` | No access | SELECT own profile |

**Session creation** uses a Supabase RPC function `get_or_create_session(p_qr_token TEXT)`:
```sql
CREATE OR REPLACE FUNCTION get_or_create_session(p_qr_token TEXT)
RETURNS sessions AS $$
DECLARE
  v_table tables%ROWTYPE;
  v_session sessions%ROWTYPE;
BEGIN
  -- Verify token
  SELECT * INTO v_table FROM tables WHERE qr_token = p_qr_token;
  IF NOT FOUND THEN RAISE EXCEPTION 'invalid_token'; END IF;

  -- Get existing active session or create new one
  INSERT INTO sessions (table_id, status)
  VALUES (v_table.id, 'active')
  ON CONFLICT (table_id) WHERE status = 'active' DO NOTHING;

  SELECT * INTO v_session FROM sessions
  WHERE table_id = v_table.id AND status = 'active';

  RETURN v_session;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Kitchen route `/kitchen`**: No auth required but intended for restaurant-internal network only. RLS on `orders` allows SELECT to `anon` role (not sensitive — menu items and table numbers only). For production: restrict `/kitchen` access at network level (router-level block on external IPs) or add a simple numeric PIN in env var.

---

## Error States (Customer UI)

| Scenario | UI Response |
|----------|-------------|
| Invalid QR token | "ไม่พบโต๊ะนี้ กรุณาสแกน QR Code ใหม่" พร้อมไม่แสดงเมนู |
| No available menu items | "เมนูยังไม่พร้อม กรุณาติดต่อพนักงาน" |
| Order submission fails (network) | "ส่งออเดอร์ไม่สำเร็จ กรุณาลองใหม่" พร้อมปุ่ม retry, ไม่ล้าง cart |
| Item sold out (detected at submit time) | แสดง dialog "รายการต่อไปนี้หมดแล้ว: [list]" ให้ลบหรือแก้ก่อนยืนยัน |

---

## Not In Scope (Future Work)

- Online payment / PromptPay QR
- Order cancellation by customer
- Printer integration (receipt / kitchen ticket printer)
- Loyalty points / membership
- Sales analytics / reporting dashboard
- Multi-branch support
- Push notifications (PWA) — ใช้ Web Audio API แทนก่อน

---

## File Structure

```
restaurant-qr-ordering/
├── app/
│   ├── menu/
│   │   └── page.tsx          — Customer ordering UI
│   ├── kitchen/
│   │   └── page.tsx          — Kitchen display
│   ├── admin/
│   │   ├── page.tsx          — Admin dashboard
│   │   ├── menu/
│   │   │   └── page.tsx      — Menu management
│   │   └── tables/
│   │       └── page.tsx      — Table + QR management
│   └── api/
│       ├── orders/route.ts
│       ├── sessions/route.ts
│       └── notifications/route.ts
├── components/
│   ├── customer/             — MenuCard, CartDrawer, OrderHistory
│   ├── kitchen/              — OrderCard, TimerBadge
│   ├── admin/                — TableGrid, NotificationBanner, MenuForm
│   └── shared/               — SoundAlert, RealtimeProvider
├── lib/
│   ├── supabase/
│   │   ├── client.ts         — Browser client
│   │   └── server.ts         — Server-side client
│   └── realtime/
│       └── hooks.ts          — useOrders, useNotifications hooks
├── supabase/
│   └── migrations/           — SQL migration files
└── public/
    └── sounds/
        └── ding.mp3
```

---

## Realtime Implementation

```typescript
// lib/realtime/hooks.ts
// Role-specific subscriptions — filter by notification type per role
//
// NOTE: Supabase Realtime postgres_changes supports `eq` filters reliably.
// The `in` filter may not be supported server-side in all Supabase versions.
// Implementer should verify — if `in` filter is unsupported, filter client-side:
//   (payload) => { if (['call_staff','bill_request'].includes(payload.new.type)) onNew(...) }

// Kitchen: only new_order
export function useKitchenNotifications(onNew: (n: Notification) => void) {
  const supabase = createBrowserClient()
  useEffect(() => {
    const channel = supabase
      .channel('kitchen-orders')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications',
          filter: 'type=eq.new_order' },
        (payload) => onNew(payload.new as Notification)
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])
}

// Admin: call_staff and bill_request — filter client-side for reliability
export function useAdminNotifications(onNew: (n: Notification) => void) {
  const supabase = createBrowserClient()
  useEffect(() => {
    const channel = supabase
      .channel('admin-alerts')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const n = payload.new as Notification
          if (['call_staff', 'bill_request'].includes(n.type)) onNew(n)
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])
}
```

---

## Verification Plan

1. **Seed data**: สร้าง tables 1–10, categories, menu items ผ่าน Supabase dashboard
2. **Customer flow**: เปิด `/menu?token=<token>` → สั่งอาหาร → สั่งเพิ่ม → เช็คบิล
3. **Kitchen**: เปิด `/kitchen` บน tab ใหม่ → ต้องเห็น order ทันทีพร้อมเสียง
4. **Admin**: login → dashboard → เห็น table สีเปลี่ยนตาม status
5. **Bill flow**: ลูกค้ากด checkbill → admin เห็น notification → คลิก close → table กลับเป็น available
6. **Menu CRUD**: admin เพิ่มเมนูใหม่ + upload รูป → ปรากฏใน customer menu ทันที

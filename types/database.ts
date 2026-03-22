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

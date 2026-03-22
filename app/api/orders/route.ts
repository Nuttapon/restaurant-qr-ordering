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

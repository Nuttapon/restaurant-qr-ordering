import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = getSupabaseServiceClient()
  const { sessionId, tableId, items } = await request.json()

  if (!sessionId || !tableId || !items?.length) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Fix C1: Verify session exists, belongs to the given table, and is active
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('id, table_id, status')
    .eq('id', sessionId)
    .eq('table_id', tableId)
    .eq('status', 'active')
    .single()
  if (sessionError || !session) {
    return NextResponse.json({ error: 'Invalid or expired session' }, { status: 403 })
  }

  // Fix C1: Re-fetch item prices from menu_items instead of trusting client-supplied unitPrice
  const menuItemIds = items.map((i: { menuItemId: string }) => i.menuItemId)
  const { data: menuItemRows, error: menuError } = await supabase
    .from('menu_items')
    .select('id, price, is_available')
    .in('id', menuItemIds)
  if (menuError || !menuItemRows) {
    return NextResponse.json({ error: 'Failed to fetch menu items' }, { status: 500 })
  }
  // Check all items exist and are available
  const priceMap = new Map(menuItemRows.map(m => [m.id, m]))
  for (const item of items) {
    const menuItem = priceMap.get(item.menuItemId)
    if (!menuItem || !menuItem.is_available) {
      return NextResponse.json({ error: `Item ${item.menuItemId} not available` }, { status: 400 })
    }
  }

  // Fix M4: Use max round instead of count to avoid race condition
  const { data: lastOrder } = await supabase
    .from('orders')
    .select('round')
    .eq('session_id', sessionId)
    .order('round', { ascending: false })
    .limit(1)
    .maybeSingle()

  const round = (lastOrder?.round ?? 0) + 1

  // Create order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({ session_id: sessionId, table_id: tableId, round, status: 'pending' })
    .select()
    .single()

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 500 })
  }

  // Create order items — use server-fetched prices
  const orderItems = items.map((item: {
    menuItemId: string; quantity: number; unitPrice: number; note?: string
  }) => ({
    order_id: order.id,
    menu_item_id: item.menuItemId,
    quantity: item.quantity,
    unit_price: priceMap.get(item.menuItemId)!.price,
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

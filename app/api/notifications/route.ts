import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = getSupabaseServiceClient()
  const { sessionId, tableId, type } = await request.json()

  if (!sessionId || !tableId || !['call_staff', 'bill_request'].includes(type)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  // Verify session ownership — same pattern as /api/orders
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

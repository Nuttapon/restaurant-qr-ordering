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

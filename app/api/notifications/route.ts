import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient()
  const { tableId, type } = await request.json()

  if (!tableId || !['call_staff', 'bill_request'].includes(type)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  // Fix C1: Verify the table exists before inserting a notification
  const { data: table, error: tableError } = await supabase
    .from('tables')
    .select('id')
    .eq('id', tableId)
    .single()
  if (tableError || !table) {
    return NextResponse.json({ error: 'Invalid table' }, { status: 403 })
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

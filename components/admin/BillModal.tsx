'use client'
import { useEffect, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { Table } from '@/types/database'
import { formatPrice } from '@/lib/utils'

interface OrderItemDetail {
  id: string
  quantity: number
  unit_price: number
  note: string | null
  status: string
  menu_item: {
    id: string
    name_th: string
    name_en: string
  }
}

interface OrderDetail {
  id: string
  round: number
  status: string
  created_at: string
  order_items: OrderItemDetail[]
}

interface Props {
  table: Table
  onClose: () => void
  onBillClosed: (tableId: string) => void
}

export function BillModal({ table, onClose, onBillClosed }: Props) {
  const [orders, setOrders] = useState<OrderDetail[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [closing, setClosing] = useState(false)
  const [closeError, setCloseError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const supabase = getSupabaseBrowserClient()

    async function load() {
      setLoading(true)
      setFetchError(null)

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!cancelled) setUserId(user?.id ?? null)

      // Get active session for this table
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select('id')
        .eq('table_id', table.id)
        .eq('status', 'active')
        .single()

      if (sessionError || !session) {
        if (!cancelled) {
          setFetchError('ไม่พบ session ที่ active สำหรับโต๊ะนี้')
          setLoading(false)
        }
        return
      }

      if (!cancelled) setSessionId(session.id)

      // Fetch session summary
      const { data, error: summaryError } = await supabase.rpc('get_session_summary', {
        p_session_id: session.id,
        p_qr_token: table.qr_token,
      })

      if (!cancelled) {
        if (summaryError) {
          setFetchError('ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่')
        } else if (Array.isArray(data)) {
          setOrders(data as OrderDetail[])
        }
        setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [table.id, table.qr_token])

  const total = orders.reduce(
    (sum, order) =>
      sum + (order.order_items ?? []).reduce((s, item) => s + item.unit_price * item.quantity, 0),
    0
  )

  async function handleCloseBill() {
    if (!sessionId) return
    setClosing(true)
    setCloseError(null)
    const supabase = getSupabaseBrowserClient()

    const { error: sessionError } = await supabase
      .from('sessions')
      .update({ status: 'closed', closed_by: userId })
      .eq('id', sessionId)

    if (sessionError) {
      setCloseError('ไม่สามารถปิด session ได้ กรุณาลองใหม่')
      setClosing(false)
      return
    }

    const { error: tableError } = await supabase
      .from('tables')
      .update({ status: 'available' })
      .eq('id', table.id)

    if (tableError) {
      setCloseError('ไม่สามารถอัปเดตสถานะโต๊ะได้ กรุณาลองใหม่')
      setClosing(false)
      return
    }

    onBillClosed(table.id)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-bold">บิลโต๊ะ {table.number}</h2>
          <button onClick={onClose} className="text-gray-400 text-2xl leading-none hover:text-gray-600">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {loading && (
            <p className="text-center text-gray-400 py-8">กำลังโหลด...</p>
          )}
          {fetchError && (
            <p className="text-center text-red-500 py-8">{fetchError}</p>
          )}
          {!loading && !fetchError && orders.length === 0 && (
            <p className="text-center text-gray-400 py-8">ยังไม่มีรายการ</p>
          )}
          {orders.map(order => {
            const roundTotal = (order.order_items ?? []).reduce(
              (s, item) => s + item.unit_price * item.quantity,
              0
            )
            return (
              <div key={order.id} className="border rounded-xl p-3">
                <p className="text-xs text-gray-400 font-semibold uppercase mb-2">
                  รอบที่ {order.round}
                </p>
                {(order.order_items ?? []).map(item => (
                  <div key={item.id} className="flex justify-between text-sm py-1">
                    <span>
                      {item.menu_item.name_th} × {item.quantity}
                      {item.note ? <span className="text-gray-400 text-xs ml-1">({item.note})</span> : null}
                    </span>
                    <span>{formatPrice(item.unit_price * item.quantity)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-medium pt-2 border-t mt-2 text-gray-600">
                  <span>รวมรอบที่ {order.round}</span>
                  <span>{formatPrice(roundTotal)}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t space-y-3">
          <div className="flex justify-between font-bold text-xl">
            <span>รวมทั้งหมด</span>
            <span className="text-orange-500">{formatPrice(total)}</span>
          </div>

          {closeError && (
            <p className="text-center text-sm text-red-500 bg-red-50 p-2 rounded-xl">{closeError}</p>
          )}

          <button
            onClick={handleCloseBill}
            disabled={closing || loading || !!fetchError || !sessionId}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-3 rounded-xl font-bold text-lg transition-colors"
          >
            {closing ? 'กำลังปิดบิล...' : 'ปิดบิล (Close Bill)'}
          </button>
        </div>
      </div>
    </div>
  )
}

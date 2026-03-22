'use client'
import { useEffect, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
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
  sessionId: string
  tableId: string
  tableNumber: number
  qrToken: string
  onClose: () => void
}

export function OrderSummary({ sessionId, tableId, tableNumber, qrToken, onClose }: Props) {
  const [orders, setOrders] = useState<OrderDetail[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [requested, setRequested] = useState(false)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    supabase
      .rpc('get_session_summary', { p_session_id: sessionId, p_qr_token: qrToken })
      .then(({ data }: { data: unknown }) => {
        if (Array.isArray(data)) setOrders(data as OrderDetail[])
      })
  }, [sessionId, qrToken])

  const total = orders.reduce((sum, order) =>
    sum + (order.order_items ?? []).reduce((s, item) =>
      s + item.unit_price * item.quantity, 0
    ), 0
  )

  async function handleRequestBill() {
    setSubmitting(true)
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableId, type: 'bill_request' }),
    })
    setRequested(true)
    setSubmitting(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl max-h-[85vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-bold">สรุปรายการ — โต๊ะ {tableNumber}</h2>
          <button onClick={onClose} className="text-gray-400 text-2xl leading-none">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {orders.length === 0 && (
            <p className="text-center text-gray-400 py-8">ยังไม่มีรายการ</p>
          )}
          {orders.map(order => (
            <div key={order.id}>
              <p className="text-xs text-gray-400 font-semibold uppercase mb-2">
                รอบที่ {order.round}
              </p>
              {(order.order_items ?? []).map(item => (
                <div key={item.id} className="flex justify-between text-sm py-1">
                  <span>{item.menu_item.name_th} × {item.quantity}</span>
                  <span>{formatPrice(item.unit_price * item.quantity)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="p-4 border-t space-y-3">
          <div className="flex justify-between font-bold text-xl">
            <span>รวมทั้งหมด</span>
            <span className="text-orange-500">{formatPrice(total)}</span>
          </div>

          {requested ? (
            <div className="bg-green-50 text-green-700 text-center p-3 rounded-xl font-medium">
              ✅ แจ้งเรียบร้อยแล้ว พนักงานกำลังมา
            </div>
          ) : (
            <button
              onClick={handleRequestBill}
              disabled={submitting}
              className="w-full bg-red-500 text-white py-3 rounded-xl font-bold text-lg disabled:opacity-50 hover:bg-red-600 transition-colors"
            >
              {submitting ? 'กำลังส่ง...' : '🧾 ขอเช็คบิล'}
            </button>
          )}
          <p className="text-center text-xs text-gray-400">พนักงานจะมาหาคุณในไม่ช้า</p>
        </div>
      </div>
    </div>
  )
}

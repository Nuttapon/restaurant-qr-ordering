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
  onOrderMore: () => void
}

export function OrderSummary({ sessionId, tableId, tableNumber, qrToken, onClose, onOrderMore }: Props) {
  const [orders, setOrders] = useState<OrderDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Bill confirmation flow
  const [showBillConfirm, setShowBillConfirm] = useState(false)
  const [billSubmitting, setBillSubmitting] = useState(false)
  const [billRequested, setBillRequested] = useState(false)
  const [billError, setBillError] = useState<string | null>(null)

  // Call staff state
  const [callingStaff, setCallingStaff] = useState(false)
  const [staffCalled, setStaffCalled] = useState(false)
  const [staffError, setStaffError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    setLoading(true)
    setFetchError(null)
    supabase
      .rpc('get_session_summary', { p_session_id: sessionId, p_qr_token: qrToken })
      .then(({ data, error }: { data: unknown; error: unknown }) => {
        if (error) {
          setFetchError('ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่')
        } else if (Array.isArray(data)) {
          setOrders(data as OrderDetail[])
        }
      })
      .finally(() => {
        setLoading(false)
      })
  }, [sessionId, qrToken])

  const total = orders.reduce((sum, order) =>
    sum + (order.order_items ?? []).reduce((s, item) =>
      s + item.unit_price * item.quantity, 0
    ), 0
  )

  async function handleCallStaff() {
    setCallingStaff(true)
    setStaffError(null)
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, tableId, type: 'call_staff' }),
      })
      if (!res.ok) throw new Error('การแจ้งเตือนล้มเหลว')
      setStaffCalled(true)
    } catch (err) {
      setStaffError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
    } finally {
      setCallingStaff(false)
    }
  }

  async function handleConfirmBill() {
    setBillSubmitting(true)
    setBillError(null)
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, tableId, type: 'bill_request' }),
      })
      if (!res.ok) throw new Error('การส่งคำขอล้มเหลว กรุณาลองใหม่')
      setBillRequested(true)
    } catch (err) {
      setBillError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
    } finally {
      setBillSubmitting(false)
    }
  }

  // ─── Bill confirmation view ──────────────────────────────────────────────
  if (showBillConfirm) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col justify-end">
        <div
          className="absolute inset-0 bg-black/50 animate-fade-in"
          onClick={() => { if (!billRequested) setShowBillConfirm(false) }}
        />
        <div className="relative bg-[var(--brand-surface-card)] rounded-t-3xl max-h-[85vh] flex flex-col animate-slide-up">
          <div className="w-10 h-1 rounded-full bg-[var(--brand-text-muted)]/30 mx-auto pt-3 mb-1" />
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-bold text-[var(--brand-text-primary)]">ยืนยันขอเช็คบิล — โต๊ะ {tableNumber}</h2>
            {!billRequested && (
              <button onClick={() => setShowBillConfirm(false)} className="text-gray-400 text-2xl leading-none">✕</button>
            )}
          </div>

          <div className="overflow-y-auto flex-1 p-4 space-y-4">
            {orders.map(order => {
              const roundTotal = (order.order_items ?? []).reduce(
                (s, item) => s + item.unit_price * item.quantity, 0
              )
              return (
                <div key={order.id} className="bg-[var(--brand-surface)] rounded-xl p-4">
                  <p className="text-xs text-gray-400 font-semibold uppercase mb-2">รอบที่ {order.round}</p>
                  {(order.order_items ?? []).map(item => (
                    <div key={item.id} className="flex justify-between text-sm py-1">
                      <span>{item.menu_item.name_th} × {item.quantity}</span>
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

          <div className="p-4 border-t space-y-3">
            <div className="flex justify-between font-bold text-xl">
              <span>รวมทั้งหมด</span>
              <span className="text-[var(--brand-primary)]">{formatPrice(total)}</span>
            </div>

            {billError && (
              <p className="text-center text-sm text-red-500 bg-red-50 p-2 rounded-xl">{billError}</p>
            )}

            {billRequested ? (
              <div className="bg-green-50 text-green-700 text-center p-3 rounded-xl font-medium">
                แจ้งเรียบร้อยแล้ว พนักงานจะมาหาคุณในไม่ช้า
              </div>
            ) : (
              <button
                onClick={handleConfirmBill}
                disabled={billSubmitting}
                className="w-full bg-red-500 text-white py-3 rounded-xl font-bold text-lg disabled:opacity-50 hover:bg-red-600 transition-colors"
              >
                {billSubmitting ? 'กำลังส่ง...' : 'ยืนยันขอเช็คบิล'}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ─── Main order summary view ─────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={onClose} />
      <div className="relative bg-[var(--brand-surface-card)] rounded-t-3xl max-h-[85vh] flex flex-col animate-slide-up">
        <div className="w-10 h-1 rounded-full bg-[var(--brand-text-muted)]/30 mx-auto pt-3 mb-1" />
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-bold text-[var(--brand-text-primary)]">สรุปรายการ — โต๊ะ {tableNumber}</h2>
          <button onClick={onClose} className="text-gray-400 text-2xl leading-none">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {loading && (
            <div className="space-y-3 py-4 px-4">
              <div className="h-4 rounded bg-[var(--brand-text-muted)]/20 animate-pulse w-3/4" />
              <div className="h-4 rounded bg-[var(--brand-text-muted)]/20 animate-pulse w-1/2" />
              <div className="h-4 rounded bg-[var(--brand-text-muted)]/20 animate-pulse w-2/3" />
            </div>
          )}
          {fetchError && (
            <p className="text-center text-red-500 py-8">{fetchError}</p>
          )}
          {!loading && !fetchError && orders.length === 0 && (
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

        <div className="p-4 border-t space-y-2">
          {staffError && (
            <p className="text-center text-xs text-red-500">{staffError}</p>
          )}

          <button
            onClick={onOrderMore}
            className="w-full bg-[var(--brand-primary)] text-white py-3 rounded-xl font-bold text-lg hover:bg-[var(--brand-primary-hover)] transition-colors"
          >
            สั่งเพิ่ม
          </button>

          <button
            onClick={handleCallStaff}
            disabled={callingStaff || staffCalled}
            className="w-full bg-[var(--brand-status-occupied-bg)] text-[var(--brand-status-occupied)] border border-[var(--brand-status-occupied)]/20 py-3 rounded-xl font-bold text-lg disabled:opacity-60 transition-colors"
          >
            {callingStaff ? 'กำลังแจ้ง...' : staffCalled ? 'เรียกแล้ว' : 'เรียกพนักงาน'}
          </button>

          <button
            onClick={() => setShowBillConfirm(true)}
            className="w-full bg-[var(--brand-status-bill-bg)] text-[var(--brand-status-bill)] border border-[var(--brand-status-bill)]/20 py-3 rounded-xl font-bold text-lg transition-colors"
          >
            ขอเช็คบิล
          </button>
        </div>
      </div>
    </div>
  )
}

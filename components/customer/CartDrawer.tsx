'use client'
import { useEffect, useState } from 'react'
import { useCartStore } from '@/store/cart'
import { formatPrice } from '@/lib/utils'

interface Props {
  sessionId: string
  tableId: string
  onOrderPlaced: (orderId: string, round: number) => void
}

export function CartDrawer({ sessionId, tableId, onOrderPlaced }: Props) {
  const { items, updateQuantity, updateNote, setSessionId, clearCart, totalPrice } = useCartStore()
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Feature 5: sync sessionId to clear stale cart on new session
  useEffect(() => {
    setSessionId(sessionId)
  }, [sessionId, setSessionId])

  const total = totalPrice()
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          tableId,
          items: items.map(i => ({
            menuItemId: i.menuItem.id,
            quantity: i.quantity,
            unitPrice: i.menuItem.price,
            note: i.note ?? null,
          })),
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'ส่งออเดอร์ไม่สำเร็จ')
      }
      const { orderId, round } = await res.json()
      clearCart()
      setOpen(false)
      onOrderPlaced(orderId, round)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setSubmitting(false)
    }
  }

  if (itemCount === 0) return null

  return (
    <>
      {/* Floating cart button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-primary text-white px-8 py-4 rounded-full shadow-lg shadow-primary/30 flex items-center gap-4 z-40 transition-all hover:scale-105 active:scale-95 animate-pop min-h-[56px]"
      >
        <span className="bg-white text-primary text-sm font-black rounded-full min-w-[28px] h-7 px-2 flex items-center justify-center shadow-sm">
          {itemCount}
        </span>
        <span className="font-bold text-lg leading-none">ดูตะกร้า</span>
        <span className="font-black text-lg leading-none bg-white/20 px-3 py-1 rounded-full">{formatPrice(total)}</span>
      </button>

      {/* Drawer backdrop */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setOpen(false)}
          />
          <div className="relative bg-surface-card rounded-t-[32px] max-h-[85vh] flex flex-col animate-slide-up shadow-2xl">
            <div className="w-12 h-1.5 rounded-full bg-slate-200 mx-auto mt-4 mb-2" />
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-2xl font-black text-slate-800">รายการสั่งอาหาร</h2>
              <button 
                onClick={() => setOpen(false)} 
                className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 active:scale-95 transition-all"
                aria-label="ปิด"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-5">
              {items.map(({ menuItem, quantity, note }) => (
                <div key={menuItem.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm relative group">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <p className="font-bold text-slate-800 text-lg leading-snug">{menuItem.name_th}</p>
                      <p className="text-primary font-black mt-1 text-lg">{formatPrice(menuItem.price)}</p>
                    </div>
                    <div className="flex items-center gap-3 bg-slate-50 rounded-2xl p-1 border border-slate-100 mt-1">
                      <button
                        onClick={() => updateQuantity(menuItem.id, quantity - 1)}
                        className="w-10 h-10 rounded-xl bg-white text-primary font-black text-xl flex items-center justify-center hover:bg-slate-100 shadow-sm border border-slate-200 active:scale-95 transition-all cursor-pointer"
                        aria-label="ลด"
                      >−</button>
                      <span className="w-8 text-center font-bold text-lg text-slate-800">{quantity}</span>
                      <button
                        onClick={() => updateQuantity(menuItem.id, quantity + 1)}
                        className="w-10 h-10 rounded-xl bg-primary text-white font-black text-xl flex items-center justify-center hover:bg-primary-hover shadow-md shadow-primary/20 active:scale-95 transition-all cursor-pointer"
                        aria-label="เพิ่ม"
                      >+</button>
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="📝 หมายเหตุ (เช่น ขอไม่เผ็ด, ไม่ใส่ผักชี)"
                    value={note ?? ''}
                    onChange={(e) => updateNote(menuItem.id, e.target.value)}
                    className="w-full mt-4 text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-slate-100 bg-white/50 backdrop-blur-md space-y-4 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
              {error && (
                <div className="bg-red-50 text-red-600 font-medium text-sm p-4 rounded-2xl flex justify-between items-center shadow-sm border border-red-100">
                  <span>⚠️ {error}</span>
                  <button onClick={handleSubmit} className="underline font-bold active:opacity-70 whitespace-nowrap ml-4">ลองใหม่</button>
                </div>
              )}
              <div className="flex justify-between items-center font-black text-2xl px-2">
                <span className="text-slate-800">ยอดรวม</span>
                <span className="text-primary">{formatPrice(total)}</span>
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-primary text-white py-4 min-h-[60px] rounded-2xl font-black text-xl disabled:opacity-50 hover:bg-primary-hover active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xl shadow-primary/30"
              >
                {submitting ? 'กำลังส่งออเดอร์...' : 'ยืนยันสั่งอาหาร ✓'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

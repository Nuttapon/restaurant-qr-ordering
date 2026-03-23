'use client'
import { useState } from 'react'
import { useCartStore } from '@/store/cart'
import { formatPrice } from '@/lib/utils'

interface Props {
  sessionId: string
  tableId: string
  onOrderPlaced: (orderId: string) => void
}

export function CartDrawer({ sessionId, tableId, onOrderPlaced }: Props) {
  const { items, updateQuantity, clearCart, totalPrice } = useCartStore()
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      const { orderId } = await res.json()
      clearCart()
      setOpen(false)
      onOrderPlaced(orderId)
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
        className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[var(--brand-primary)] text-white px-6 py-3.5 rounded-2xl shadow-lg flex items-center gap-3 z-40 transition-colors"
      >
        <span className="bg-white text-[var(--brand-primary)] text-xs font-bold rounded-full px-1.5 flex items-center justify-center">
          {itemCount}
        </span>
        <span className="font-semibold">ดูตะกร้า</span>
        <span className="font-bold">{formatPrice(total)}</span>
      </button>

      {/* Drawer backdrop */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/50 animate-fade-in"
            onClick={() => setOpen(false)}
          />
          <div className="relative bg-[var(--brand-surface-card)] rounded-t-3xl max-h-[80vh] flex flex-col animate-slide-up">
            <div className="w-10 h-1 rounded-full bg-[var(--brand-text-muted)]/30 mx-auto pt-3 mb-1" />
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold text-[var(--brand-text-primary)]">รายการสั่ง</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 text-2xl leading-none">✕</button>
            </div>

            <div className="overflow-y-auto flex-1 p-4 space-y-3">
              {items.map(({ menuItem, quantity }) => (
                <div key={menuItem.id} className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{menuItem.name_th}</p>
                    <p className="text-[var(--brand-primary)] text-sm">{formatPrice(menuItem.price)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(menuItem.id, quantity - 1)}
                      className="w-8 h-8 rounded-full bg-[var(--brand-primary-light)] text-[var(--brand-primary)] font-bold text-lg flex items-center justify-center"
                    >−</button>
                    <span className="w-6 text-center font-bold">{quantity}</span>
                    <button
                      onClick={() => updateQuantity(menuItem.id, quantity + 1)}
                      className="w-8 h-8 rounded-full bg-[var(--brand-primary)] text-white font-bold text-lg flex items-center justify-center"
                    >+</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t space-y-3">
              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex justify-between">
                  <span>{error}</span>
                  <button onClick={handleSubmit} className="underline ml-2">ลองใหม่</button>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg">
                <span>รวม</span>
                <span className="text-[var(--brand-primary)]">{formatPrice(total)}</span>
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-[var(--brand-primary)] text-white py-3 rounded-xl font-bold text-lg disabled:opacity-50 hover:bg-[var(--brand-primary-hover)] transition-colors"
              >
                {submitting ? 'กำลังส่ง...' : 'สั่งอาหาร ✓'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

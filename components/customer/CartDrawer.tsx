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
        className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3 z-40 hover:bg-orange-600 transition-colors"
      >
        <span className="bg-white text-orange-500 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
          {itemCount}
        </span>
        <span className="font-semibold">ดูตะกร้า</span>
        <span className="font-bold">{formatPrice(total)}</span>
      </button>

      {/* Drawer backdrop */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <div className="relative bg-white rounded-t-2xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold">รายการสั่ง</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 text-2xl leading-none">✕</button>
            </div>

            <div className="overflow-y-auto flex-1 p-4 space-y-3">
              {items.map(({ menuItem, quantity }) => (
                <div key={menuItem.id} className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{menuItem.name_th}</p>
                    <p className="text-orange-500 text-sm">{formatPrice(menuItem.price)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(menuItem.id, quantity - 1)}
                      className="w-8 h-8 rounded-full bg-gray-100 font-bold text-lg flex items-center justify-center"
                    >−</button>
                    <span className="w-6 text-center font-bold">{quantity}</span>
                    <button
                      onClick={() => updateQuantity(menuItem.id, quantity + 1)}
                      className="w-8 h-8 rounded-full bg-orange-500 text-white font-bold text-lg flex items-center justify-center"
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
                <span className="text-orange-500">{formatPrice(total)}</span>
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold text-lg disabled:opacity-50 hover:bg-orange-600 transition-colors"
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

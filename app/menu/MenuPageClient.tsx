'use client'
import { useState, useRef, useEffect } from 'react'
import { Session, Table, MenuCategory, MenuItem } from '@/types/database'
import { CategoryTabs } from '@/components/customer/CategoryTabs'
import { MenuItemCard } from '@/components/customer/MenuItemCard'
import { CartDrawer } from '@/components/customer/CartDrawer'
import { OrderSummary } from '@/components/customer/OrderSummary'

interface Props {
  session: Session
  table: Table
  categories: MenuCategory[]
  menuItems: MenuItem[]
}

export function MenuPageClient({ session, table, categories, menuItems }: Props) {
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)
  const [placedOrderIds, setPlacedOrderIds] = useState<string[]>([])
  const [showSummary, setShowSummary] = useState(false)

  const [callStaffLoading, setCallStaffLoading] = useState(false)
  const [callStaffSuccess, setCallStaffSuccess] = useState(false)
  const [callStaffError, setCallStaffError] = useState<string | null>(null)

  const callStaffSuccessTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const callStaffErrorTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fix M5: Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (callStaffSuccessTimer.current) clearTimeout(callStaffSuccessTimer.current)
      if (callStaffErrorTimer.current) clearTimeout(callStaffErrorTimer.current)
    }
  }, [])

  const filtered = activeCategoryId
    ? menuItems.filter(i => i.category_id === activeCategoryId)
    : menuItems

  function handleOrderPlaced(orderId: string) {
    setPlacedOrderIds(prev => [...prev, orderId])
  }

  async function handleCallStaff() {
    setCallStaffLoading(true)
    setCallStaffError(null)
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id, tableId: table.id, type: 'call_staff' }),
      })
      if (!res.ok) throw new Error('การแจ้งเตือนล้มเหลว')
      setCallStaffSuccess(true)
      if (callStaffSuccessTimer.current) clearTimeout(callStaffSuccessTimer.current)
      callStaffSuccessTimer.current = setTimeout(() => setCallStaffSuccess(false), 3000)
    } catch (err) {
      setCallStaffError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
      if (callStaffErrorTimer.current) clearTimeout(callStaffErrorTimer.current)
      callStaffErrorTimer.current = setTimeout(() => setCallStaffError(null), 4000)
    } finally {
      setCallStaffLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--brand-surface)]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#D4622B] to-[#C7522A] shadow-md text-white px-4 py-3 flex justify-between items-center sticky top-0 z-30">
        <h1 className="font-bold text-lg">เมนู</h1>
        <span className="text-sm bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full font-medium">โต๊ะ {table.number}</span>
      </div>

      {/* Category tabs */}
      <div className="px-4 py-3 bg-white shadow-[var(--brand-shadow-sm)] sticky top-14 z-20">
        <CategoryTabs
          categories={categories}
          activeId={activeCategoryId}
          onSelect={setActiveCategoryId}
        />
      </div>

      {/* Menu items */}
      <div className="px-4 py-3 space-y-3 pb-48">
        {filtered.map(item => (
          <MenuItemCard key={item.id} item={item} />
        ))}
      </div>

      {/* Post-order action buttons */}
      {placedOrderIds.length > 0 && (
        <div className="fixed bottom-24 left-0 right-0 flex flex-col items-center gap-1 z-40">
          {callStaffError && (
            <span className="bg-red-100 text-red-700 text-xs px-3 py-1 rounded-full shadow">
              {callStaffError}
            </span>
          )}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl px-4 py-3 shadow-[var(--brand-shadow-lg)] mx-4 flex gap-2">
            <button
              onClick={handleCallStaff}
              disabled={callStaffLoading || callStaffSuccess}
              className="bg-[var(--brand-status-occupied-bg)] text-[var(--brand-status-occupied)] border border-[var(--brand-status-occupied)]/20 rounded-xl px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {callStaffLoading ? 'กำลังแจ้ง...' : callStaffSuccess ? 'เรียกแล้ว' : 'เรียกพนักงาน'}
            </button>
            <button
              onClick={() => setShowSummary(true)}
              className="bg-[var(--brand-status-bill-bg)] text-[var(--brand-status-bill)] border border-[var(--brand-status-bill)]/20 rounded-xl px-4 py-2 text-sm font-semibold transition-colors"
            >
              เช็คบิล
            </button>
          </div>
        </div>
      )}

      {/* Cart drawer */}
      <CartDrawer
        sessionId={session.id}
        tableId={table.id}
        onOrderPlaced={handleOrderPlaced}
      />

      {/* Bill summary modal */}
      {showSummary && (
        <OrderSummary
          sessionId={session.id}
          tableId={table.id}
          tableNumber={table.number}
          qrToken={table.qr_token}
          onClose={() => setShowSummary(false)}
          onOrderMore={() => setShowSummary(false)}
        />
      )}
    </div>
  )
}

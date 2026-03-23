'use client'
import { useState, useRef, useEffect } from 'react'
import { Session, Table, MenuCategory, MenuItem } from '@/types/database'
import { CategoryTabs } from '@/components/customer/CategoryTabs'
import { MenuItemCard } from '@/components/customer/MenuItemCard'
import { CartDrawer } from '@/components/customer/CartDrawer'
import { OrderSummary } from '@/components/customer/OrderSummary'
import { useSoundAlert } from '@/components/shared/SoundAlert'
import { useCallStaff } from '@/lib/hooks/useCallStaff'

interface Props {
  session: Session
  table: Table
  categories: MenuCategory[]
  menuItems: MenuItem[]
}

export function MenuPageClient({ session, table, categories, menuItems }: Props) {
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [placedOrderIds, setPlacedOrderIds] = useState<string[]>([])
  const [showSummary, setShowSummary] = useState(false)
  const [orderToast, setOrderToast] = useState<number | null>(null) // stores round number
  const orderToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  
  const { callStaff, loading: callStaffLoading, success: callStaffSuccess, error: callStaffError } = useCallStaff(session.id, table.id)

  const { playDing } = useSoundAlert()

  useEffect(() => {
    return () => {
      if (orderToastTimer.current) clearTimeout(orderToastTimer.current)
    }
  }, [])

  const filtered = menuItems.filter(item => {
    const matchesCategory = activeCategoryId ? item.category_id === activeCategoryId : true
    const q = searchQuery.trim().toLowerCase()
    const matchesSearch = q
      ? item.name_th.toLowerCase().includes(q) || item.name_en.toLowerCase().includes(q)
      : true
    return matchesCategory && matchesSearch
  })

  function handleOrderPlaced(orderId: string, round: number) {
    setPlacedOrderIds(prev => [...prev, orderId])
    // Feature 6: sound + toast
    playDing()
    setOrderToast(round)
    if (orderToastTimer.current) clearTimeout(orderToastTimer.current)
    orderToastTimer.current = setTimeout(() => setOrderToast(null), 3500)
  }

  return (
    <div className="min-h-screen bg-surface pb-32">
      {/* Order confirmation toast */}
      {orderToast !== null && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-4 rounded-full shadow-2xl font-bold text-md animate-slide-up pointer-events-none flex items-center gap-3">
          <span className="text-xl">🎉</span>
          สั่งอาหารแล้ว รอบที่ {orderToast}
        </div>
      )}

      {/* Header */}
      <div className="bg-primary shadow-sm text-white px-5 py-4 flex justify-between items-center sticky top-0 z-30 transition-all rounded-b-[24px]">
        <h1 className="font-black text-2xl tracking-tight">เมนูอาหาร</h1>
        <span className="text-sm bg-white/20 backdrop-blur-md text-white px-4 py-1.5 rounded-full font-bold shadow-inner">โต๊ะ {table.number}</span>
      </div>

      {/* Search + Category tabs */}
      <div className="px-5 pt-4 pb-2 bg-surface/80 backdrop-blur-xl sticky top-[68px] z-20 transition-all">
        {/* Search bar */}
        <div className="relative mb-2 shadow-sm rounded-2xl">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">🔍</span>
          <input
            type="search"
            placeholder="ค้นหาเมนู..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-5 py-3.5 text-md focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all font-medium text-slate-800 placeholder:text-slate-400 shadow-sm"
          />
        </div>
        <CategoryTabs
          categories={categories}
          activeId={activeCategoryId}
          onSelect={setActiveCategoryId}
        />
      </div>

      {/* Menu items */}
      <div className="px-5 py-4 space-y-4">
        {filtered.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300 mx-2">
            <span className="text-4xl block mb-4 opacity-50">🍽️</span>
            <p className="text-slate-500 font-medium">ไม่พบเมนูที่ค้นหา</p>
          </div>
        )}
        {filtered.map(item => (
          <MenuItemCard key={item.id} item={item} />
        ))}
      </div>

      {/* Post-order action buttons */}
      {placedOrderIds.length > 0 && (
        <div className="fixed bottom-24 left-0 right-0 flex flex-col items-center gap-2 z-30 animate-fade-in pointer-events-none">
          {callStaffError && (
            <span className="bg-red-100 text-red-700 text-sm font-bold px-4 py-2 rounded-full shadow-lg border border-red-200 pointer-events-auto">
              {callStaffError}
            </span>
          )}
          <div className="bg-white/90 backdrop-blur-xl rounded-[28px] p-2 shadow-2xl mx-4 flex gap-2 border border-slate-200/50 pointer-events-auto">
            <button
              onClick={callStaff}
              disabled={callStaffLoading || callStaffSuccess}
              className="bg-status-occupied-bg text-status-occupied border border-status-occupied/20 rounded-[20px] px-5 py-3.5 text-md font-bold transition-all disabled:opacity-60 active:scale-95 shadow-sm hover:shadow-md flex-1"
            >
              {callStaffLoading ? 'กำลังแจ้ง...' : callStaffSuccess ? 'เรียกแล้ว ✓' : '🙋‍♂️ เรียกพนักงาน'}
            </button>
            <button
              onClick={() => setShowSummary(true)}
              className="bg-status-bill-bg text-status-bill border border-status-bill/20 rounded-[20px] px-5 py-3.5 text-md font-bold transition-all active:scale-95 shadow-sm hover:shadow-md flex-1"
            >
              🧾 เช็คบิล
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

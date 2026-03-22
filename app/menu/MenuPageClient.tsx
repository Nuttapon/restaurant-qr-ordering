'use client'
import { useState } from 'react'
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

  const filtered = activeCategoryId
    ? menuItems.filter(i => i.category_id === activeCategoryId)
    : menuItems

  function handleOrderPlaced(orderId: string) {
    setPlacedOrderIds(prev => [...prev, orderId])
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-orange-500 text-white px-4 py-3 flex justify-between items-center sticky top-0 z-30">
        <h1 className="font-bold text-lg">🍜 เมนู</h1>
        <span className="text-sm bg-orange-400 px-3 py-1 rounded-full">โต๊ะ {table.number}</span>
      </div>

      {/* Category tabs */}
      <div className="px-4 py-3 bg-white border-b sticky top-14 z-20">
        <CategoryTabs
          categories={categories}
          activeId={activeCategoryId}
          onSelect={setActiveCategoryId}
        />
      </div>

      {/* Menu items */}
      <div className="px-4 py-3 space-y-3 pb-40">
        {filtered.map(item => (
          <MenuItemCard key={item.id} item={item} />
        ))}
      </div>

      {/* Post-order action buttons */}
      {placedOrderIds.length > 0 && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 flex gap-2 z-40">
          <button
            onClick={() => {
              fetch('/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tableId: table.id, type: 'call_staff' }),
              })
            }}
            className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-medium shadow-md"
          >
            🙋 เรียกพนักงาน
          </button>
          <button
            onClick={() => setShowSummary(true)}
            className="bg-pink-100 text-pink-800 px-4 py-2 rounded-full text-sm font-medium shadow-md"
          >
            🧾 เช็คบิล
          </button>
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
        />
      )}
    </div>
  )
}

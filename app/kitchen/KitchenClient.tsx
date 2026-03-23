'use client'
import { useState, useCallback } from 'react'
import { useSoundAlert } from '@/components/shared/SoundAlert'
import { useKitchenNotifications } from '@/lib/realtime/hooks'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { Notification } from '@/types/database'
import { OrderCard } from '@/components/kitchen/OrderCard'
import type { OrderWithItems } from '@/components/kitchen/OrderCard'

interface Props {
  initialOrders: OrderWithItems[]
}

export function KitchenClient({ initialOrders }: Props) {
  const [orders, setOrders] = useState<OrderWithItems[]>(initialOrders)
  const { playDing } = useSoundAlert()

  const onNew = useCallback(
    async (notification: Notification) => {
      playDing()
      if (!notification.order_id) return
      const supabase = getSupabaseBrowserClient()
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*, menu_items(*)), tables(number)')
        .eq('id', notification.order_id)
        .single()
      if (data) {
        setOrders(prev => {
          const exists = prev.some(o => o.id === (data as OrderWithItems).id)
          return exists ? prev : [...prev, data as unknown as OrderWithItems]
        })
      }
    },
    [playDing]
  )

  useKitchenNotifications(onNew)

  const pendingCount = orders.filter(
    o => !o.order_items.every(i => i.status === 'done')
  ).length

  return (
    <div className="min-h-screen bg-[var(--brand-kitchen-bg)]">
      <div className="sticky top-0 z-10 bg-[var(--brand-kitchen-card)] border-b border-[var(--brand-kitchen-border)] px-4 py-3 flex items-center justify-between">
        <h1 className="text-white font-bold text-xl">ครัว</h1>
        <span className="bg-[var(--brand-primary)] text-white text-sm font-bold px-3 py-1 rounded-full">
          {pendingCount} ออเดอร์
        </span>
      </div>

      <div className="p-4">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
              <span className="text-3xl">✅</span>
            </div>
            <p className="text-[var(--brand-text-muted)] text-lg font-medium">ไม่มีออเดอร์ค้างอยู่</p>
            <p className="text-[#6B6460] text-sm">ออเดอร์ใหม่จะปรากฏที่นี่อัตโนมัติ</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.map(order => (
              <div key={order.id} className="animate-scale-in">
                <OrderCard order={order} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

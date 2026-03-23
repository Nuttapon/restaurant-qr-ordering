'use client'
import { useState, useCallback } from 'react'
import { useSoundAlert } from '@/components/shared/SoundAlert'
import { useKitchenNotifications } from '@/lib/realtime/hooks'
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
      
      try {
        const res = await fetch(`/api/kitchen/orders/${notification.order_id}`)
        if (res.ok) {
          const data = await res.json()
          setOrders(prev => {
            const exists = prev.some(o => o.id === data.id)
            return exists ? prev : [...prev, data as OrderWithItems]
          })
        }
      } catch (err) {
        console.error('Failed to fetch new order:', err)
      }
    },
    [playDing]
  )

  useKitchenNotifications(onNew)

  const pendingCount = orders.filter(
    o => !o.order_items.every(i => i.status === 'done')
  ).length

  return (
    <div className="min-h-screen bg-kitchen-bg text-slate-100 selection:bg-primary/30">
      <div className="sticky top-0 z-10 bg-kitchen-card border-b border-kitchen-border px-6 py-4 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <h1 className="text-white font-bold text-2xl tracking-wide uppercase">ออเดอร์ครัว</h1>
          <span className="text-slate-400 text-sm hidden sm:inline-block">Live Kitchen Display</span>
        </div>
        
        <span className="bg-primary text-white text-lg font-bold px-5 py-2 rounded-full shadow-lg border border-white/10">
          รอทำ {pendingCount} บิล
        </span>
      </div>

      <div className="p-4 sm:p-6 xl:p-8">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-5">
            <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
              <span className="text-5xl">✅</span>
            </div>
            <h2 className="text-slate-200 text-2xl font-bold tracking-wide">ไม่มีออเดอร์ค้างอยู่</h2>
            <p className="text-slate-400 text-lg">พักผ่อนได้ สบายใจหายห่วง ☕️</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xlg:grid-cols-3 2xl:grid-cols-4 gap-5 md:gap-6">
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

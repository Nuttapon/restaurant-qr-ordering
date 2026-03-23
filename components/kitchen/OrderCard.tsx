'use client'
import { useState, useEffect } from 'react'
import { Order, OrderItem, MenuItem } from '@/types/database'
import { TimerBadge } from './TimerBadge'
import { cn } from '@/lib/utils'

export type OrderWithItems = Order & {
  order_items: (OrderItem & { menu_items: MenuItem })[]
  tables: { number: number }
}

export function OrderCard({ order }: { order: OrderWithItems }) {
  const [items, setItems] = useState(order.order_items)
  const [elapsedMin, setElapsedMin] = useState(0)

  useEffect(() => {
    const start = new Date(order.created_at).getTime()
    const update = () => setElapsedMin(Math.floor(Math.max(0, Date.now() - start) / 60000))
    update()
    const interval = setInterval(update, 60000)
    return () => clearInterval(interval)
  }, [order.created_at])

  const allDone = items.length > 0 && items.every(i => i.status === 'done')
  const doneCount = items.filter(i => i.status === 'done').length

  const urgencyBorder = allDone
    ? 'border-green-500/50'
    : elapsedMin >= 10
      ? 'border-red-500'
      : elapsedMin >= 5
        ? 'border-yellow-400'
        : 'border-[var(--brand-kitchen-border)]'

  async function handleMarkDone(itemId: string) {
    try {
      const res = await fetch(`/api/kitchen/order-items/${itemId}`, {
        method: 'PATCH'
      })
      if (res.ok) {
        setItems(prev =>
          prev.map(i => (i.id === itemId ? { ...i, status: 'done' as const } : i))
        )
      }
    } catch (err) {
      console.error('Failed to mark item done:', err)
    }
  }

  return (
    <div
      className={cn(
        'rounded-xl border-2 p-4 bg-[var(--brand-kitchen-card)] flex flex-col gap-3',
        allDone ? 'opacity-50' : '',
        urgencyBorder
      )}
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-lg">โต๊ะ {order.tables.number}</span>
          <span className="text-slate-400 text-sm">รอบ {order.round}</span>
          <span className="text-slate-500 text-xs">#{order.id.slice(-4)}</span>
        </div>
        <TimerBadge createdAt={order.created_at} />
      </div>

      {!allDone && items.length > 1 && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-300"
              style={{ width: `${(doneCount / items.length) * 100}%` }}
            />
          </div>
          <span className="text-xs text-[var(--brand-text-muted)]">{doneCount}/{items.length}</span>
        </div>
      )}

      <ul className="flex flex-col gap-2">
        {items.map(item => (
          <li key={item.id} className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  'text-sm font-medium',
                  item.status === 'done' ? 'line-through text-slate-500' : 'text-white'
                )}
              >
                {item.menu_items.name_th} × {item.quantity}
              </p>
              {item.note && (
                <p className="text-xs text-yellow-300 mt-0.5">หมายเหตุ: {item.note}</p>
              )}
            </div>
            {item.status !== 'done' ? (
              <button
                onClick={() => handleMarkDone(item.id)}
                className="flex-shrink-0 text-xs bg-green-600 hover:bg-green-500 text-white px-2 py-1 rounded-lg font-semibold transition-colors"
              >
                ✓ Done
              </button>
            ) : (
              <span className="flex-shrink-0 text-xs text-green-400 font-semibold">✓ Done</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

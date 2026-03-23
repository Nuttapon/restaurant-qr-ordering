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
    ? 'border-green-500/30 bg-kitchen-card/50'
    : elapsedMin >= 10
      ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)] ring-1 ring-red-500'
      : elapsedMin >= 5
        ? 'border-yellow-500/80 ring-1 ring-yellow-500/50'
        : 'border-kitchen-border'

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
        'rounded-2xl border-2 p-5 bg-kitchen-card flex flex-col gap-4 shadow-lg transition-all',
        allDone ? 'opacity-60 scale-[0.98]' : 'hover:shadow-xl',
        urgencyBorder
      )}
    >
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <span className="text-white font-black text-2xl tracking-tight leading-none">โต๊ะ {order.tables.number}</span>
            <span className="bg-white/10 text-white font-bold px-2 py-0.5 rounded text-sm">รอบ {order.round}</span>
          </div>
          <span className="text-slate-500 text-xs font-mono uppercase tracking-widest mt-1">#{order.id.slice(0,8)}</span>
        </div>
        <TimerBadge createdAt={order.created_at} />
      </div>

      {!allDone && items.length > 1 && (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-500 ease-out"
              style={{ width: `${(doneCount / items.length) * 100}%` }}
            />
          </div>
          <span className="text-sm font-bold text-slate-400 min-w-[30px] text-right">{doneCount}/{items.length}</span>
        </div>
      )}

      <ul className="flex flex-col gap-3 mt-1">
        {items.map(item => (
          <li 
            key={item.id} 
            className={cn(
              "flex items-center justify-between gap-3 p-3 rounded-xl transition-colors",
              item.status === 'done' ? 'bg-white/5' : 'bg-slate-800/50 hover:bg-slate-800'
            )}
          >
            <div className="flex-1 min-w-0 pr-2">
              <p
                className={cn(
                  'text-lg font-bold leading-tight',
                  item.status === 'done' ? 'line-through text-slate-500' : 'text-slate-100'
                )}
              >
                {item.menu_items.name_th} <span className="text-primary ml-1 text-xl">× {item.quantity}</span>
              </p>
              {item.note && (
                <div className="mt-1.5 flex items-start gap-1">
                  <span className="text-yellow-500 text-xs mt-0.5">⚠️</span>
                  <p className="text-sm text-yellow-400 font-medium pb-0.5">{item.note}</p>
                </div>
              )}
            </div>
            {item.status !== 'done' ? (
              <button
                onClick={() => handleMarkDone(item.id)}
                className="shrink-0 flex items-center justify-center min-w-[80px] min-h-[50px] bg-green-600 hover:bg-green-500 active:scale-95 text-white px-4 rounded-xl font-bold shadow-md transition-all cursor-pointer border-b-4 border-green-700 hover:border-green-600 active:border-t-4 active:border-b-0"
              >
                <span className="text-lg">✓ Done</span>
              </button>
            ) : (
              <span className="shrink-0 flex items-center justify-center min-w-[80px] min-h-[50px] text-green-500 font-bold opacity-70">
                <span className="text-xl">✓ เสร็จ</span>
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

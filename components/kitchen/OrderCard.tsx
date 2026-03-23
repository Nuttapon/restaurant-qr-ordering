'use client'
import { useState } from 'react'
import { Order, OrderItem, MenuItem } from '@/types/database'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { TimerBadge } from './TimerBadge'
import { cn } from '@/lib/utils'

export type OrderWithItems = Order & {
  order_items: (OrderItem & { menu_items: MenuItem })[]
  tables: { number: number }
}

export function OrderCard({ order }: { order: OrderWithItems }) {
  const [items, setItems] = useState(order.order_items)

  const allDone = items.length > 0 && items.every(i => i.status === 'done')
  const doneCount = items.filter(i => i.status === 'done').length

  const elapsedMin = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000)
  const urgencyBorder = allDone
    ? 'border-green-500/50'
    : elapsedMin >= 10
      ? 'border-red-500'
      : elapsedMin >= 5
        ? 'border-yellow-400'
        : 'border-[var(--brand-kitchen-border)]'

  async function handleMarkDone(itemId: string) {
    const supabase = getSupabaseBrowserClient()
    const { error } = await supabase
      .from('order_items')
      .update({ status: 'done' })
      .eq('id', itemId)
    if (!error) {
      setItems(prev =>
        prev.map(i => (i.id === itemId ? { ...i, status: 'done' as const } : i))
      )
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

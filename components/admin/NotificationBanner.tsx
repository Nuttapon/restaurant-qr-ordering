import { Notification, Table } from '@/types/database'
import { timeAgo } from '@/lib/utils'

interface Props {
  notifications: Notification[]
  tables: Table[]
  onMarkAllRead: () => void
}

const TYPE_CONFIG: Record<string, { icon: string; label: string }> = {
  call_staff: { icon: '🔔', label: 'เรียกพนักงาน' },
  bill_request: { icon: '📋', label: 'ขอเช็คบิล' },
  new_order: { icon: '🍽️', label: 'สั่งอาหารใหม่' },
}

export function NotificationBanner({ notifications, tables, onMarkAllRead }: Props) {
  const tableMap = Object.fromEntries(tables.map(t => [t.id, t.number]))

  const relevant = notifications.filter(
    n => !n.is_read && (n.type === 'call_staff' || n.type === 'bill_request' || n.type === 'new_order')
  )

  if (relevant.length === 0) return null

  return (
    <div className="bg-[var(--brand-surface-card)] border border-[var(--brand-text-muted)]/15 rounded-2xl p-4 mb-5 shadow-[var(--brand-shadow-sm)] animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-[var(--brand-text-primary)] text-sm">
          การแจ้งเตือน ({relevant.length})
        </span>
        <button
          onClick={onMarkAllRead}
          className="text-xs text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] font-medium"
        >
          อ่านทั้งหมด
        </button>
      </div>
      <ul className="flex flex-col gap-1">
        {relevant.map(n => {
          const config = TYPE_CONFIG[n.type]
          return (
            <li key={n.id} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5">
                <span>{config?.icon ?? '📢'}</span>
                <span className="text-[var(--brand-text-primary)]">
                  โต๊ะ {tableMap[n.table_id] ?? '?'}
                </span>
                <span className="text-[var(--brand-text-secondary)]">
                  {config?.label ?? n.type}
                </span>
              </span>
              <span className="text-[var(--brand-text-muted)] text-xs ml-2 shrink-0">{timeAgo(n.created_at)}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

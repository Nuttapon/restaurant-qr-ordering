'use client'
import { Notification, Table } from '@/types/database'
import { timeAgo } from '@/lib/utils'

interface Props {
  notifications: Notification[]
  tables: Table[]
  onMarkAllRead: () => void
}

const TYPE_LABEL: Record<string, string> = {
  call_staff: 'เรียกพนักงาน',
  bill_request: 'ขอเช็คบิล',
}

export function NotificationBanner({ notifications, tables, onMarkAllRead }: Props) {
  const tableMap = Object.fromEntries(tables.map(t => [t.id, t.number]))

  const relevant = notifications.filter(
    n => !n.is_read && (n.type === 'call_staff' || n.type === 'bill_request')
  )

  if (relevant.length === 0) return null

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-orange-700 text-sm">
          การแจ้งเตือน ({relevant.length})
        </span>
        <button
          onClick={onMarkAllRead}
          className="text-xs text-orange-600 underline hover:text-orange-800"
        >
          อ่านทั้งหมด
        </button>
      </div>
      <ul className="flex flex-col gap-1">
        {relevant.map(n => (
          <li key={n.id} className="flex items-center justify-between text-sm text-orange-800">
            <span>
              โต๊ะ {tableMap[n.table_id] ?? '?'} {TYPE_LABEL[n.type] ?? n.type}
            </span>
            <span className="text-orange-500 text-xs ml-2 shrink-0">{timeAgo(n.created_at)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

import { Table, Notification } from '@/types/database'
import { cn } from '@/lib/utils'

interface Props {
  tables: Table[]
  notifications: Notification[]
  onTableClick: (table: Table) => void
}

const STATUS_LABELS: Record<Table['status'], string> = {
  available: 'ว่าง',
  occupied: 'มีลูกค้า',
  bill_requested: 'เช็คบิล',
}

const STATUS_COLORS: Record<Table['status'], string> = {
  available: 'bg-green-100 border-green-300 text-green-800',
  occupied: 'bg-yellow-100 border-yellow-300 text-yellow-800',
  bill_requested: 'bg-pink-100 border-pink-400 text-pink-800',
}

export function TableGrid({ tables, notifications, onTableClick }: Props) {
  const unreadByTable = notifications.reduce<Record<string, Notification[]>>((acc, n) => {
    if (!n.is_read && (n.type === 'call_staff' || n.type === 'bill_request')) {
      acc[n.table_id] = acc[n.table_id] ? [...acc[n.table_id], n] : [n]
    }
    return acc
  }, {})

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {tables.map(table => {
        const alerts = unreadByTable[table.id] ?? []
        const hasAlert = alerts.length > 0

        return (
          <button
            key={table.id}
            onClick={() => onTableClick(table)}
            className={cn(
              'relative rounded-xl border-2 p-4 text-left transition-transform active:scale-95 hover:shadow-md',
              STATUS_COLORS[table.status]
            )}
          >
            <div className="text-3xl font-extrabold">{table.number}</div>
            <div className="text-sm mt-1 font-medium">{STATUS_LABELS[table.status]}</div>

            {hasAlert && (
              <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold">
                {alerts.length}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

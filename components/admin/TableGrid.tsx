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
  available: 'bg-[var(--brand-status-available-bg)] border-[var(--brand-status-available)]/30 text-[var(--brand-status-available)]',
  occupied: 'bg-[var(--brand-status-occupied-bg)] border-[var(--brand-status-occupied)]/30 text-[var(--brand-status-occupied)]',
  bill_requested: 'bg-[var(--brand-status-bill-bg)] border-[var(--brand-status-bill)]/30 text-[var(--brand-status-bill)]',
}

export function TableGrid({ tables, notifications, onTableClick }: Props) {
  const unreadByTable = notifications.reduce<Record<string, Notification[]>>((acc, n) => {
    if (!n.is_read && (n.type === 'call_staff' || n.type === 'bill_request')) {
      acc[n.table_id] = acc[n.table_id] ? [...acc[n.table_id], n] : [n]
    }
    return acc
  }, {})

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {tables.map(table => {
        const alerts = unreadByTable[table.id] ?? []
        const hasAlert = alerts.length > 0

        return (
          <button
            key={table.id}
            onClick={() => onTableClick(table)}
            className={cn(
              'relative rounded-xl border-2 p-4 text-left transition-transform active:scale-95 hover:shadow-md hover:shadow-[var(--brand-shadow-md)]',
              STATUS_COLORS[table.status]
            )}
          >
            <div className="text-3xl font-extrabold">{table.number}</div>
            <div className="text-xs mt-1.5 font-semibold uppercase tracking-wide">{STATUS_LABELS[table.status]}</div>

            {hasAlert && (
              <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--brand-status-bill)] text-white text-xs font-bold">
                {alerts.length}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

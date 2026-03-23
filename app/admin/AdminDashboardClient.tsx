'use client'
import { useState, useCallback } from 'react'
import { Table, Notification } from '@/types/database'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { useAdminNotifications } from '@/lib/realtime/hooks'
import { useSoundAlert } from '@/components/shared/SoundAlert'
import { TableGrid } from '@/components/admin/TableGrid'
import { NotificationBanner } from '@/components/admin/NotificationBanner'
import { BillModal } from '@/components/admin/BillModal'

interface Props {
  tables: Table[]
  initialNotifications: Notification[]
}

export function AdminDashboardClient({ tables: initialTables, initialNotifications }: Props) {
  const [tables, setTables] = useState<Table[]>(initialTables)
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const { playDing } = useSoundAlert()

  const onNew = useCallback(
    async (notification: Notification) => {
      playDing()
      setNotifications(prev => [notification, ...prev])

      // Re-fetch the table that triggered the notification
      const supabase = getSupabaseBrowserClient()
      const { data } = await supabase
        .from('tables')
        .select('*')
        .eq('id', notification.table_id)
        .single()

      if (data) {
        setTables(prev =>
          prev.map(t => (t.id === (data as Table).id ? (data as Table) : t))
        )
      }
    },
    [playDing]
  )

  useAdminNotifications(onNew)

  async function handleMarkAllRead() {
    const unreadIds = notifications
      .filter(n => !n.is_read && (n.type === 'call_staff' || n.type === 'bill_request'))
      .map(n => n.id)

    if (unreadIds.length === 0) return

    const supabase = getSupabaseBrowserClient()
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', unreadIds)

    if (!error) {
      setNotifications(prev =>
        prev.map(n => (unreadIds.includes(n.id) ? { ...n, is_read: true } : n))
      )
    }
  }

  function handleTableClick(table: Table) {
    setSelectedTable(table)
  }

  function handleBillClosed(tableId: string) {
    setTables(prev =>
      prev.map(t => (t.id === tableId ? { ...t, status: 'available' } : t))
    )
  }

  return (
    <div>
      <NotificationBanner
        notifications={notifications}
        tables={tables}
        onMarkAllRead={handleMarkAllRead}
      />

      <TableGrid
        tables={tables}
        notifications={notifications}
        onTableClick={handleTableClick}
      />

      {selectedTable && (
        <BillModal
          table={selectedTable}
          onClose={() => setSelectedTable(null)}
          onBillClosed={handleBillClosed}
        />
      )}
    </div>
  )
}

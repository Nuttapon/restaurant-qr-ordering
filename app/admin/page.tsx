import { getSupabaseServerClient } from '@/lib/supabase/server'
import { AdminDashboardClient } from './AdminDashboardClient'
import type { Table, Notification } from '@/types/database'

export default async function AdminPage() {
  const supabase = await getSupabaseServerClient()

  const [{ data: tables }, { data: notifications }] = await Promise.all([
    supabase.from('tables').select('*').order('number'),
    supabase
      .from('notifications')
      .select('*')
      .eq('is_read', false)
      .order('created_at', { ascending: false }),
  ])

  return (
    <AdminDashboardClient
      tables={(tables as Table[]) ?? []}
      initialNotifications={(notifications as Notification[]) ?? []}
    />
  )
}

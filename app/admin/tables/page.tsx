import Link from 'next/link'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import type { Table } from '@/types/database'
import { TablesClient } from './TablesClient'

export default async function AdminTablesPage() {
  const supabase = await getSupabaseServerClient()

  const { data: tables, error } = await supabase
    .from('tables')
    .select('*')
    .order('number')

  if (error) {
    throw new Error(error.message)
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-700">
          ← Admin
        </Link>
        <h1 className="text-xl font-bold text-gray-800">Tables & QR Codes</h1>
      </div>

      <TablesClient tables={(tables as Table[]) ?? []} />
    </div>
  )
}

import Link from 'next/link'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import type { MenuCategory, MenuItem } from '@/types/database'
import { MenuManagementClient } from './MenuManagementClient'

export default async function AdminMenuPage() {
  const supabase = await getSupabaseServerClient()

  const [{ data: categories }, { data: menuItems }] = await Promise.all([
    supabase.from('menu_categories').select('*').order('sort_order'),
    supabase.from('menu_items').select('*').order('sort_order'),
  ])

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-700">
          ← Admin
        </Link>
        <h1 className="text-xl font-bold text-gray-800">Menu Management</h1>
      </div>

      <MenuManagementClient
        categories={(categories as MenuCategory[]) ?? []}
        menuItems={(menuItems as MenuItem[]) ?? []}
      />
    </div>
  )
}

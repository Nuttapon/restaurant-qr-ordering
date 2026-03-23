import { getSupabaseServerClient } from '@/lib/supabase/server'
import { MenuPageClient } from './MenuPageClient'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ token?: string }>
}

export default async function MenuPage({ searchParams }: Props) {
  const { token } = await searchParams

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <div className="text-center p-8">
          <p className="text-4xl mb-4">📱</p>
          <h1 className="text-xl font-bold text-gray-700">กรุณาสแกน QR Code</h1>
          <p className="text-gray-500 mt-2">Please scan the QR code at your table</p>
        </div>
      </div>
    )
  }

  const supabase = await getSupabaseServerClient()

  // Call get_or_create_session RPC
  const { data, error } = await supabase.rpc('get_or_create_session', {
    p_qr_token: token,
  })

  if (error || !data) {
    console.error('get_or_create_session failed:', error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <div className="text-center p-8">
          <p className="text-4xl mb-4">❌</p>
          <h1 className="text-xl font-bold text-gray-700">ไม่พบโต๊ะนี้</h1>
          <p className="text-gray-500 mt-2">กรุณาสแกน QR Code ใหม่</p>
          <p className="text-gray-400 text-sm mt-1">Table not found. Please scan again.</p>
        </div>
      </div>
    )
  }

  // Fetch menu
  const { data: categories } = await supabase
    .from('menu_categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')

  const { data: menuItems } = await supabase
    .from('menu_items')
    .select('*')
    .eq('is_available', true)
    .order('sort_order')

  if (!menuItems?.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <div className="text-center p-8">
          <p className="text-4xl mb-4">🍽️</p>
          <h1 className="text-xl font-bold text-gray-700">เมนูยังไม่พร้อม</h1>
          <p className="text-gray-500 mt-2">กรุณาติดต่อพนักงาน</p>
        </div>
      </div>
    )
  }

  return (
    <MenuPageClient
      session={data.session}
      table={data.table}
      categories={categories ?? []}
      menuItems={menuItems ?? []}
    />
  )
}

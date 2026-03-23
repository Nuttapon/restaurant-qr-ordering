import { getSupabaseServiceClient } from '@/lib/supabase/server'
import { KitchenClient } from './KitchenClient'
import type { OrderWithItems } from '@/components/kitchen/OrderCard'

export const dynamic = 'force-dynamic'

export default async function KitchenPage() {
  const supabase = getSupabaseServiceClient()
  const { data: orders } = await supabase
    .from('orders')
    .select('*, order_items(*, menu_items(*)), tables(number)')
    .in('status', ['pending', 'confirmed'])
    .order('created_at', { ascending: true })

  return <KitchenClient initialOrders={(orders as unknown as OrderWithItems[]) ?? []} />
}

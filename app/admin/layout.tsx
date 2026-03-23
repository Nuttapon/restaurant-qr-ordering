import { redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { LogoutButton } from '@/components/admin/LogoutButton'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gray-800 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow">
        <h1 className="text-lg font-bold">Admin</h1>
        <LogoutButton />
      </header>
      <main className="p-4">{children}</main>
    </div>
  )
}

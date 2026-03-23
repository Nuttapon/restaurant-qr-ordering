import Link from 'next/link'
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
        <div className="flex items-center gap-6">
          <h1 className="text-lg font-bold">Admin</h1>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/admin" className="text-gray-300 hover:text-white transition-colors">Dashboard</Link>
            <Link href="/admin/menu" className="text-gray-300 hover:text-white transition-colors">Menu</Link>
            <Link href="/admin/tables" className="text-gray-300 hover:text-white transition-colors">Tables</Link>
          </nav>
        </div>
        <LogoutButton />
      </header>
      <main className="p-4">{children}</main>
    </div>
  )
}

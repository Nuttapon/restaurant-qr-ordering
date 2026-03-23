'use client'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/menu', label: 'Menu' },
  { href: '/admin/tables', label: 'Tables' },
]

export function AdminHeaderBar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="bg-[var(--brand-text-primary)] text-white px-5 py-3 flex items-center justify-between sticky top-0 z-20 shadow-md">
      <div className="flex items-center gap-6">
        <span className="text-lg font-bold tracking-tight">Admin</span>
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map(item => {
            const isActive = item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  isActive
                    ? 'bg-white/15 text-white rounded-lg px-3 py-1.5 text-sm font-medium'
                    : 'text-white/60 hover:text-white hover:bg-white/10 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors'
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
      <button
        onClick={handleLogout}
        className="text-sm text-white/60 hover:text-white px-3 py-1.5 rounded-lg border border-white/20 hover:border-white/40 transition-colors"
      >
        ออกจากระบบ
      </button>
    </header>
  )
}

export function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-gray-300 hover:text-white px-3 py-1 rounded border border-gray-500 hover:border-gray-300 transition-colors"
    >
      ออกจากระบบ
    </button>
  )
}

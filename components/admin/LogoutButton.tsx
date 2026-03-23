'use client'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

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

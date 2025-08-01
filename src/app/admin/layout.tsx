"use client"
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    async function checkAdminRole() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (profile?.role !== 'admin') {
        router.push('/dashboard')
        return
      }

      setIsAdmin(true)
    }

    checkAdminRole()
  }, [supabase, router])

  if (!isAdmin) {
    return null
  }

  return (
    <div className="flex min-h-screen">
      {/* Admin Sidebar */}
      <div className="w-64 bg-black/80 text-white p-6">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-cyan-400">Admin Panel</h2>
        </div>
        <nav className="space-y-4">
          <Link href="/admin/dashboard" 
                className="block py-2 px-4 rounded hover:bg-gray-800 transition-colors">
            📊 Dashboard
          </Link>
          <Link href="/admin/users" 
                className="block py-2 px-4 rounded hover:bg-gray-800 transition-colors">
            👥 Users
          </Link>
          <Link href="/admin/events" 
                className="block py-2 px-4 rounded hover:bg-gray-800 transition-colors">
            🎫 Events
          </Link>
          <Link href="/admin/applications" 
                className="block py-2 px-4 rounded hover:bg-gray-800 transition-colors">
            📝 Applications
          </Link>
          <Link href="/admin/settings" 
                className="block py-2 px-4 rounded hover:bg-gray-800 transition-colors">
            ⚙️ Settings
          </Link>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  )
}

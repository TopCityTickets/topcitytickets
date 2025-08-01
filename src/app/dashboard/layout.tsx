"use client"
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    async function checkRole() {
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

      setRole(profile?.role)
    }

    checkRole()
  }, [supabase, router])

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-black/80 text-white p-6">
        <div className="space-y-4">
          <Link href="/dashboard" 
                className="block py-2 px-4 rounded hover:bg-gray-800 transition-colors">
            🏠 Dashboard
          </Link>
          
          {/* Show Seller Dashboard link if user is seller or admin */}
          {(role === 'seller' || role === 'admin') && (
            <Link href="/seller/dashboard"
                  className="block py-2 px-4 rounded hover:bg-gray-800 transition-colors">
              🎫 Seller Dashboard
            </Link>
          )}

          {/* Show Admin Dashboard link if user is admin */}
          {role === 'admin' && (
            <Link href="/admin/dashboard"
                  className="block py-2 px-4 rounded hover:bg-gray-800 transition-colors">
              ⚙️ Admin Dashboard
            </Link>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  )
}

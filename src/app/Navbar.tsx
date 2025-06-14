"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { supabase } from '@/utils/supabase';
import type { UserRole } from '@/types/auth';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<UserRole>('user');
  
  useEffect(() => {
    const supabaseClient = supabase();
    async function getRole() {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (session?.user) {
        const { data: userData } = await supabaseClient
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        setUser(session.user);
        setUserRole(userData?.role || 'user');
      }
    }
    getRole();
  }, []);

  const handleLogout = async () => {
    const supabaseClient = supabase();
    await supabaseClient.auth.signOut();
    setUser(null);
    setUserRole('user');
  };

  return (
    <nav className="border-b">
      <div className="container mx-auto flex justify-between items-center p-4">
        <Link href="/" className="font-bold text-xl">TopCityTickets</Link>
        <div className="flex gap-4">
          {user ? (
            <>
              <Button variant="ghost" asChild>
                <Link href="/events">Events</Link>
              </Button>
              {userRole === 'seller' && (
                <Button variant="ghost" asChild>
                  <Link href="/seller/my-events">My Events</Link>
                </Button>
              )}
              {userRole === 'admin' && (
                <>
                  <Button variant="ghost" asChild>
                    <Link href="/admin/dashboard">Dashboard</Link>
                  </Button>
                  <Button variant="ghost" asChild>
                    <Link href="/admin/requests">Requests</Link>
                  </Button>
                </>
              )}
              {userRole === 'user' && (
                <Button variant="ghost" asChild>
                  <Link href="/become-seller">Become a Seller</Link>
                </Button>
              )}
              <Button variant="outline" onClick={handleLogout}>Logout</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button variant="default" asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { supabase } from '@/utils/supabase';
import type { UserRole } from '@/types/auth';
import type { Database } from '@/types/database.types';

type UserData = {
  role: UserRole;
};

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<UserRole>('user');
  
  useEffect(() => {
    const supabaseClient = supabase();
    async function getRole() {
      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session?.user) {
          // Simple query with explicit type for the response
          const { data } = await supabaseClient
            .from('users')
            .select('role')
            .match({ id: session.user.id })
            .single() as { data: UserData | null };
          
          setUser(session.user);
          if (data) {
            setUserRole(data.role);
          }
        }
      } catch (err) {
        console.error('Error fetching user role:', err);
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

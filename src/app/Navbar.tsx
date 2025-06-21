"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { supabase } from '@/utils/supabase';
import type { UserRole } from '@/types/auth';
import type { User } from '@supabase/supabase-js';

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('user');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const client = supabase();
    
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await client.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await getUserRole(session.user.id);
      }
      setLoading(false);
    };    // Get user role from database
    const getUserRole = async (userId: string) => {
      try {
        const { data, error } = await client
          .from('users')
          .select('role')
          .match({ id: userId })
          .single();
        
        if (!error && data && typeof data === 'object' && 'role' in data) {
          setUserRole(data.role as UserRole);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      }
    };

    // Listen for auth changes
    const { data: { subscription } } = client.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          await getUserRole(session.user.id);
        } else {
          setUser(null);
          setUserRole('user');
        }
        setLoading(false);
      }
    );

    getSession();

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const client = supabase();
    await client.auth.signOut();
    window.location.href = '/';
  };

  if (loading) {
    return (
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-blue-600">
                TopCityTickets
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-8 bg-gray-200 animate-pulse rounded"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-blue-600">
              TopCityTickets
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              // Authenticated user navigation
              <>
                <Link href="/events" className="text-gray-700 hover:text-blue-600">
                  Events
                </Link>
                
                {userRole === 'admin' && (
                  <Link href="/admin/dashboard" className="text-gray-700 hover:text-blue-600">
                    Admin Dashboard
                  </Link>
                )}
                
                {userRole === 'seller' && (
                  <Link href="/seller/dashboard" className="text-gray-700 hover:text-blue-600">
                    Seller Dashboard
                  </Link>
                )}
                
                {userRole === 'user' && (
                  <Link href="/dashboard" className="text-gray-700 hover:text-blue-600">
                    Dashboard
                  </Link>
                )}
                
                <Button onClick={handleSignOut} variant="outline">
                  Sign Out
                </Button>
              </>
            ) : (
              // Guest navigation
              <>
                <Link href="/events" className="text-gray-700 hover:text-blue-600">
                  Events
                </Link>
                <Link href="/login">
                  <Button variant="outline">Sign In</Button>
                </Link>
                <Link href="/signup">
                  <Button>Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

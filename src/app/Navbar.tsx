"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/utils/supabase";
import type { User } from "@supabase/supabase-js";
import type { UserRole } from "@/types/auth";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('user');

  useEffect(() => {
    const initAuth = async () => {
      const supabaseClient = supabase();
      const { data: { session } } = await supabaseClient.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);
        const { data: userData } = await supabaseClient
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        if (userData) {
          setUserRole(userData.role as UserRole);
        }
      }
    };

    initAuth();

    const supabaseClient = supabase();
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          const { data: userData } = await supabaseClient
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();
          
          if (userData) {
            setUserRole(userData.role as UserRole);
          }
        } else {
          setUser(null);
          setUserRole('user');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    const supabaseClient = supabase();
    await supabaseClient.auth.signOut();
    window.location.href = '/';
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
              {userRole === 'admin' && (
                <Button variant="ghost" asChild>
                  <Link href="/admin/dashboard">Admin</Link>
                </Button>
              )}
              {userRole === 'seller' && (
                <Button variant="ghost" asChild>
                  <Link href="/seller/dashboard">Seller</Link>
                </Button>
              )}
              <Button variant="outline" onClick={handleSignOut}>
                Logout ({user.email})
              </Button>
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
    </nav>
  );
}
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
            <Link href="/events" className="text-gray-700 hover:text-blue-600">
              Events
            </Link>
            
            {user ? (
              <>
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
                  Sign Out ({user.email})
                </Button>
              </>
            ) : (
              <>
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

"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/utils/supabase";
import type { User } from "@supabase/supabase-js";

export default function SimpleNavbar() {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>('user');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const supabaseClient = supabase();
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (!mounted) return;
        
        if (session?.user) {
          setUser(session.user);
          
          // Get user role
          const { data: userData } = await supabaseClient
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();
          
          if (!mounted) return;
          
          if (userData?.role) {
            setUserRole(userData.role);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Auth error:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    const supabaseClient = supabase();
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        if (session?.user) {
          setUser(session.user);
          
          // Get user role
          const { data: userData } = await supabaseClient
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();
          
          if (!mounted) return;
          
          if (userData?.role) {
            setUserRole(userData.role);
          }
        } else {
          setUser(null);
          setUserRole('user');
        }
        
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    const supabaseClient = supabase();
    await supabaseClient.auth.signOut();
    window.location.href = '/';
  };

  return (
    <nav className="dark-navbar sticky top-0 z-50 shadow-2xl">
      <div className="container mx-auto flex justify-between items-center p-4">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <Image 
            src="https://vzndqhzpzdphiiblwplh.supabase.co/storage/v1/object/public/pub/logo.png" 
            alt="TopCityTickets Logo" 
            width={50} 
            height={50}
            className="logo-glow pulse-glow"
          />
          <span className="brand-text-gradient text-2xl font-black tracking-tight dark-text-glow">
            TopCityTickets
          </span>
        </Link>

        <div className="flex gap-4 items-center">
          <Link href="/events" className="text-muted-foreground hover:text-primary transition-colors font-medium">
            Events
          </Link>
            {loading ? (
            <div className="w-20 h-8 animate-pulse bg-muted rounded"></div>
          ) : user ? (
            <>
              {/* Debug info - remove after testing */}
              <div className="text-xs text-muted-foreground bg-muted/20 px-2 py-1 rounded">
                Role: {userRole} | Email: {user.email?.split('@')[0]}
              </div>
              
              {userRole === 'admin' && (
                <Button variant="ghost" asChild className="hover:bg-primary/10">
                  <Link href="/admin/dashboard">Admin Dashboard</Link>
                </Button>
              )}
              {userRole === 'seller' && (
                <Button variant="ghost" asChild className="hover:bg-primary/10">
                  <Link href="/seller/dashboard">Seller Dashboard</Link>
                </Button>
              )}
              {userRole === 'user' && (
                <Button variant="ghost" asChild className="hover:bg-primary/10">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
              )}
              <Button variant="outline" onClick={handleSignOut} className="border-primary/30 hover:bg-primary/10">
                Sign Out ({user.email?.split('@')[0]})
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild className="hover:bg-primary/10">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild className="brand-gradient dark-button-glow text-white font-semibold hover:opacity-90 transition-all">
                <Link href="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

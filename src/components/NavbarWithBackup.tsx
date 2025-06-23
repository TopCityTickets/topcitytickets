"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { supabase } from "@/utils/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";

export default function Navbar() {
  const { user, role, loading } = useAuth();
  const [backupRole, setBackupRole] = useState<string>('user');

  // Backup: Store role in localStorage when we get it
  useEffect(() => {
    if (role && role !== 'user') {
      localStorage.setItem('topcitytickets-role', role);
      setBackupRole(role);
    }
  }, [role]);

  // Backup: Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('topcitytickets-role');
    if (stored) {
      setBackupRole(stored);
    }
  }, []);

  const handleSignOut = async () => {
    const supabaseClient = supabase();
    await supabaseClient.auth.signOut();
    localStorage.removeItem('topcitytickets-role');
    window.location.href = '/';
  };

  // Use backup role if main auth is broken
  const effectiveRole = loading ? backupRole : role;
  const effectiveUser = user || (backupRole !== 'user' ? { email: 'cached-user' } : null);

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
          ) : effectiveUser ? (
            <>
              {effectiveRole === 'admin' && (
                <Button variant="ghost" asChild className="hover:bg-primary/10">
                  <Link href="/admin/dashboard">Admin Dashboard</Link>
                </Button>
              )}
              {effectiveRole === 'seller' && (
                <Button variant="ghost" asChild className="hover:bg-primary/10">
                  <Link href="/seller/dashboard">Seller Dashboard</Link>
                </Button>
              )}
              {effectiveRole === 'user' && (
                <Button variant="ghost" asChild className="hover:bg-primary/10">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
              )}
              <Button variant="outline" onClick={handleSignOut} className="border-primary/30 hover:bg-primary/10">
                Sign Out ({user?.email?.split('@')[0] || 'user'})
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

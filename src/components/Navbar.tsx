"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { supabase } from "@/utils/supabase";
import { useAuth } from "@/hooks/useAuth";

export default function Navbar() {
  const { user, role, loading, isAdmin, isSeller } = useAuth();

  const handleSignOut = async () => {
    const supabaseClient = supabase();
    await supabaseClient.auth.signOut();
    window.location.href = '/';
  };

  // Debug info to help troubleshoot
  console.log('🎯 [Navbar] State:', { user: !!user, role, loading, isAdmin, isSeller });

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
          />          <span className="brand-text-gradient text-2xl font-black tracking-tight dark-text-glow relative">
            TopCityTickets
            <span className="absolute -top-1 -right-8 bg-yellow-400 text-black text-xs font-bold px-1.5 py-0.5 rounded-full shadow-lg animate-pulse">
              BETA
            </span>
          </span>
        </Link>

        <div className="flex gap-4 items-center">          <Link href="/events" className="text-muted-foreground hover:text-primary transition-colors font-medium">
            Events
          </Link>
          
          {loading ? (
            <div className="w-20 h-8 animate-pulse bg-muted rounded"></div>
          ) : user ? (
            <>
              {isAdmin && (
                <Button variant="ghost" asChild className="hover:bg-primary/10">
                  <Link href="/admin/dashboard">Admin Dashboard</Link>
                </Button>
              )}
              {isSeller && !isAdmin && (
                <Button variant="ghost" asChild className="hover:bg-primary/10">
                  <Link href="/seller/dashboard">Seller Dashboard</Link>
                </Button>
              )}
              {!isAdmin && !isSeller && (
                <Button variant="ghost" asChild className="hover:bg-primary/10">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
              )}
              <Button variant="outline" onClick={handleSignOut} className="border-primary/30 hover:bg-primary/10">
                Sign Out ({user.email?.split('@')[0]})
              </Button>            </>
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

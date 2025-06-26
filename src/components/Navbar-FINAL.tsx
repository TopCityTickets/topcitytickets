"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { supabase } from "@/utils/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";

export default function Navbar() {
  const { user, role, loading } = useAuth();
  const [isClient, setIsClient] = useState(false);

  // Wait for client-side hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSignOut = async () => {
    const supabaseClient = supabase();
    await supabaseClient.auth.signOut();
    window.location.href = '/';
  };

  // Don't render auth-dependent content until client-side
  const showAuthContent = isClient && !loading;

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
          <span className="brand-text-gradient text-2xl font-black tracking-tight dark-text-glow relative">
            TopCityTickets
            <span className="absolute -top-1 -right-8 bg-yellow-500 text-black text-xs font-bold px-1.5 py-0.5 rounded-full">
              BETA
            </span>
          </span>
        </Link>

        <div className="flex gap-4 items-center">
          <Link href="/events" className="text-muted-foreground hover:text-primary transition-colors font-medium">
            Events
          </Link>
          
          {!showAuthContent ? (
            // Loading state
            <div className="flex gap-2 items-center">
              <div className="w-24 h-8 animate-pulse bg-muted/30 rounded"></div>
              <div className="w-20 h-8 animate-pulse bg-muted/30 rounded"></div>
            </div>
          ) : user ? (
            // Authenticated user
            <div className="flex gap-2 items-center">
              {role === 'admin' && (
                <Button variant="ghost" asChild className="hover:bg-primary/10">
                  <Link href="/admin/dashboard">Admin Dashboard</Link>
                </Button>
              )}
              {role === 'seller' && (
                <Button variant="ghost" asChild className="hover:bg-primary/10">
                  <Link href="/seller/dashboard">Seller Dashboard</Link>
                </Button>
              )}
              {role === 'user' && (
                <Button variant="ghost" asChild className="hover:bg-primary/10">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={handleSignOut} 
                className="border-primary/30 hover:bg-primary/10"
              >
                Sign Out ({user.email?.split('@')[0]})
              </Button>
            </div>
          ) : (
            // Not authenticated
            <div className="flex gap-2 items-center">
              <Button variant="ghost" asChild className="hover:bg-primary/10">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild className="brand-gradient dark-button-glow text-white font-semibold hover:opacity-90 transition-all">
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";

export default function Navbar() {
  const { user, role, loading, isAdmin, isSeller } = useAuth();
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);

  // Fetch user profile picture when user is loaded
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        // Dynamic import to avoid build issues
        const { supabase } = await import("@/utils/supabase");
        const supabaseClient = supabase();
        const { data, error } = await supabaseClient
          .from('users')
          .select('profile_picture_url, avatar_url')
          .eq('id', user.id)
          .single();
        
        if (data && !error) {
          setProfilePictureUrl(data.profile_picture_url || data.avatar_url);
        }
      }
    };

    fetchUserProfile();
  }, [user]);

  const handleSignOut = async () => {
    try {
      // Dynamic import to avoid build issues
      const { supabase } = await import("@/utils/supabase");
      const supabaseClient = supabase();
      await supabaseClient.auth.signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Sign out error:', error);
      // Fallback: just redirect to home
      window.location.href = '/';
    }
  };

  // Debug info to help troubleshoot
  console.log('🎯 [Navbar] State:', { user: !!user, role, loading, isAdmin, isSeller });

  return (
    <nav className="dark-navbar sticky top-0 z-50 shadow-2xl">
      <div className="container mx-auto flex justify-between items-center p-4">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          
          <div className="relative">
            <span className="brand-text-gradient text-2xl font-black tracking-tight dark-text-glow">
              TopCityTickets
            </span>
            <span className="absolute -top-2 left-full ml-2 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg border border-white/30 animate-pulse whitespace-nowrap glow-effect">
              BETA
            </span>
          </div>
        </Link>

        <div className="flex gap-4 items-center">          <Link href="/events" className="text-muted-foreground hover:text-primary transition-colors font-medium">
            Events
          </Link>
          
          {loading ? (
            <div className="w-20 h-8 animate-pulse bg-muted rounded"></div>
          ) : user ? (
            <>
              {isAdmin && (
                <>
                  <Button variant="ghost" asChild className="hover:bg-primary/10">
                    <Link href="/admin/dashboard">Admin Dashboard</Link>
                  </Button>
                  <Button variant="ghost" asChild className="hover:bg-primary/10">
                    <Link href="/seller/dashboard">Seller Dashboard</Link>
                  </Button>
                </>
              )}
              {role === 'seller' && (
                <Button variant="ghost" asChild className="hover:bg-primary/10">
                  <Link href="/seller/dashboard">Seller Dashboard</Link>
                </Button>
              )}
              {role === 'customer' && (
                <Button variant="ghost" asChild className="hover:bg-primary/10">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
              )}
              
              {/* User Avatar and Sign Out */}
              <div className="flex items-center gap-3">
                <Link href="/dashboard/profile" className="hover:opacity-80 transition-opacity">
                  <Avatar className="w-8 h-8 border border-primary/30">
                    <AvatarImage src={profilePictureUrl || undefined} alt="Profile" />
                    <AvatarFallback className="text-xs bg-primary/20 text-primary">
                      {user.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <Button variant="outline" onClick={handleSignOut} className="border-primary/30 hover:bg-primary/10">
                  Sign Out
                </Button>
              </div>            </>
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

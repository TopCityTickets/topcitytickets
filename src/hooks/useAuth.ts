"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import type { User } from '@supabase/supabase-js';

export type UserRole = 'customer' | 'seller' | 'admin';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>('customer');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const client = supabase();
    let mounted = true;
    let initialCheckComplete = false;

    // Helper function to determine role
    const determineRole = async (authUser: User): Promise<UserRole> => {
      // Admin check first (fastest)
      if (authUser.email === 'topcitytickets@gmail.com') {
        console.log('🎯 [useAuth] Admin user detected');
        return 'admin';
      }

      // For other users, try database lookup with timeout
      try {
        console.log('� [useAuth] Checking database for role...');
        const { data: userData, error: dbError } = await client
          .from('users')
          .select('role')
          .eq('id', authUser.id)
          .single();
        
        if (dbError || !userData?.role) {
          console.warn('⚠️ [useAuth] Database lookup failed, defaulting to customer:', dbError?.message);
          return 'customer';
        }
        
        console.log('✅ [useAuth] Database role:', userData.role);
        return userData.role as UserRole;
      } catch (error) {
        console.warn('⚠️ [useAuth] Role lookup error, defaulting to customer:', error);
        return 'customer';
      }
    };

    const updateAuthState = async (authUser: User | null, skipLoading = false) => {
      if (!mounted) return;

      try {
        if (authUser) {
          setUser(authUser);
          const userRole = await determineRole(authUser);
          setRole(userRole);
        } else {
          setUser(null);
          setRole('customer');
        }
      } catch (error) {
        console.error('❌ [useAuth] Error updating auth state:', error);
        if (mounted) {
          setUser(authUser);
          setRole('customer'); // Safe fallback
        }
      } finally {
        if (mounted && !skipLoading) {
          setLoading(false);
        }
      }
    };

    const checkAuth = async () => {
      try {
        console.log('🔍 [useAuth] Initial auth check...');
        const { data: { session }, error } = await client.auth.getSession();
        
        if (error) {
          console.error('❌ [useAuth] Session error:', error);
          // Handle hook errors gracefully
          if (error.message?.includes('custom_access_token_hook') || 
              error.message?.includes('hook') || 
              error.message?.includes('pg-functions')) {
            console.warn('🔧 [useAuth] Auth hook error, trying direct user lookup...');
            try {
              const { data: { user: authUser } } = await client.auth.getUser();
              await updateAuthState(authUser);
            } catch (userError) {
              console.warn('🔧 [useAuth] Direct user lookup failed');
              await updateAuthState(null);
            }
          } else {
            await updateAuthState(null);
          }
        } else {
          await updateAuthState(session?.user || null);
        }
      } catch (error) {
        console.error('❌ [useAuth] Auth check failed:', error);
        await updateAuthState(null);
      } finally {
        initialCheckComplete = true;
      }
    };

    // Initial check
    checkAuth();

    // Auth state change listener
    const { data: { subscription } } = client.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('🔄 [useAuth] Auth state changed:', event);
        
        // Skip if initial check is still running to avoid race conditions
        if (!initialCheckComplete && event === 'INITIAL_SESSION') {
          console.log('⏭️ [useAuth] Skipping INITIAL_SESSION - already checking...');
          return;
        }
        
        try {
          await updateAuthState(session?.user || null, true);
        } catch (error) {
          console.error('❌ [useAuth] Auth state change error:', error);
          if (mounted) {
            setUser(session?.user || null);
            setRole('customer');
          }
        }
      }
    );

    // Timeout fallback to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (mounted && loading) {
        console.warn('⏰ [useAuth] Auth check timeout, setting loading to false');
        setLoading(false);
      }
    }, 5000); // 5 second timeout

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const isAdmin = role === 'admin';
  const isSeller = role === 'seller' || isAdmin;

  return {
    user,
    role,
    isAdmin,
    isSeller,
    loading,
    isAuthenticated: !!user,
    isUser: role === 'customer',
  };
}

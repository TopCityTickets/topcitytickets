"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import type { User } from '@supabase/supabase-js';

export type UserRole = 'customer' | 'seller' | 'admin';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>('customer');
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const client = supabase();
    let mounted = true;
    let initialCheckComplete = false;
    let timeoutTriggered = false;

    // Helper function to determine role with timeout
    const determineRole = async (authUser: User): Promise<UserRole> => {
      // Admin check first (fastest)
      if (authUser.email === 'topcitytickets@gmail.com') {
        console.log('🎯 [useAuth] Admin user detected');
        return 'admin';
      }

      // For other users, try database lookup with timeout
      try {
        console.log('🔍 [useAuth] Checking database for role...');
        
        // Race condition with timeout
        const dbPromise = client
          .from('users')
          .select('role')
          .eq('id', authUser.id)
          .single();
        
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Database role lookup timeout')), 3000)
        );
        
        const { data: userData, error: dbError } = await Promise.race([dbPromise, timeoutPromise]);
        
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

    const updateAuthState = async (authUser: User | null) => {
      if (!mounted || timeoutTriggered) return;

      try {
        if (authUser) {
          setUser(authUser);
          setAuthError(null);
          const userRole = await determineRole(authUser);
          if (mounted && !timeoutTriggered) {
            setRole(userRole);
          }
        } else {
          setUser(null);
          setRole('customer');
          setAuthError(null);
        }
      } catch (error) {
        console.error('❌ [useAuth] Error updating auth state:', error);
        setAuthError(error instanceof Error ? error.message : 'Auth error');
        if (mounted && !timeoutTriggered) {
          setUser(authUser);
          setRole('customer'); // Safe fallback
        }
      } finally {
        if (mounted && !timeoutTriggered) {
          setLoading(false);
        }
      }
    };

    const checkAuth = async () => {
      if (timeoutTriggered) return;
      
      try {
        console.log('🔍 [useAuth] Initial auth check...');
        
        // Race condition with timeout for initial auth
        const authPromise = client.auth.getSession();
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Auth session timeout')), 3000)
        );
        
        const { data: { session }, error } = await Promise.race([authPromise, timeoutPromise]);
        
        if (error) {
          console.error('❌ [useAuth] Session error:', error);
          setAuthError(error.message);
          
          // Handle specific auth errors
          if (error.message?.includes('timeout') || 
              error.message?.includes('custom_access_token_hook') || 
              error.message?.includes('hook') || 
              error.message?.includes('pg-functions')) {
            console.warn('🔧 [useAuth] Auth error, using fallback...');
            // Set default state without further async calls
            if (mounted && !timeoutTriggered) {
              setUser(null);
              setRole('customer');
              setLoading(false);
            }
          } else {
            await updateAuthState(null);
          }
        } else {
          await updateAuthState(session?.user || null);
        }
      } catch (error) {
        console.error('❌ [useAuth] Auth check failed:', error);
        setAuthError(error instanceof Error ? error.message : 'Auth check failed');
        if (mounted && !timeoutTriggered) {
          setUser(null);
          setRole('customer');
          setLoading(false);
        }
      } finally {
        initialCheckComplete = true;
      }
    };

    // Initial check
    checkAuth();

    // Auth state change listener with simplified handling
    const { data: { subscription } } = client.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted || timeoutTriggered) return;
        
        console.log('🔄 [useAuth] Auth state changed:', event);
        
        // Skip duplicate initial sessions
        if (!initialCheckComplete && event === 'INITIAL_SESSION') {
          console.log('⏭️ [useAuth] Skipping INITIAL_SESSION - already checking...');
          return;
        }
        
        // Simple state update for auth changes
        try {
          if (session?.user) {
            setUser(session.user);
            setAuthError(null);
            // Quick admin check
            if (session.user.email === 'topcitytickets@gmail.com') {
              setRole('admin');
            } else {
              setRole('customer'); // Default for auth changes
            }
          } else {
            setUser(null);
            setRole('customer');
            setAuthError(null);
          }
        } catch (error) {
          console.error('❌ [useAuth] Auth state change error:', error);
          setAuthError(error instanceof Error ? error.message : 'Auth state change failed');
        }
      }
    );

    // Timeout fallback - only trigger once
    const timeoutId = setTimeout(() => {
      if (mounted && loading && !timeoutTriggered) {
        console.warn('⏰ [useAuth] Auth check timeout - completing with fallback');
        timeoutTriggered = true;
        setLoading(false);
        setAuthError('Auth check timeout');
        // Keep existing user/role state if any
      }
    }, 3000); // Reduced to 3 seconds

    return () => {
      mounted = false;
      timeoutTriggered = true;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []); // Empty deps to prevent re-mounting

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
    authError, // Expose auth errors for debugging
  };
}

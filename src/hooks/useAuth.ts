"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import type { User } from '@supabase/supabase-js';

export type UserRole = 'user' | 'seller' | 'admin';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>('user');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const client = supabase();
    let mounted = true;

    const checkAuth = async () => {
      try {
        console.log('🔍 [useAuth] Checking auth...');
        const { data: { session }, error } = await client.auth.getSession();
        
        if (error) {
          console.error('❌ [useAuth] Session error:', error);
          // If it's a hook error, ignore it and continue
          if (error.message?.includes('custom_access_token_hook') || 
              error.message?.includes('hook') || 
              error.message?.includes('pg-functions')) {
            console.warn('🔧 [useAuth] Ignoring auth hook error, continuing with basic auth...');
            // Try to get user without session if hook is broken
            try {
              const { data: { user: authUser } } = await client.auth.getUser();
              if (authUser && mounted) {
                setUser(authUser);
                // Default to hardcoded admin check only
                if (authUser.email === 'topcitytickets@gmail.com') {
                  setRole('admin');
                } else {
                  setRole('user'); // Safe fallback
                }
              } else if (mounted) {
                setUser(null);
                setRole('user');
              }
            } catch (userError) {
              console.warn('🔧 [useAuth] Could not get user directly, using fallback');
              if (mounted) {
                setUser(null);
                setRole('user');
              }
            }
            if (mounted) {
              setLoading(false);
            }
            return;
          }
        }
        
        if (!mounted) return;

        if (session?.user) {
          console.log('✅ [useAuth] User found:', session.user.email);
          setUser(session.user);
          
          // BULLETPROOF ADMIN DETECTION
          if (session.user.email === 'topcitytickets@gmail.com') {
            console.log('🎯 [useAuth] ADMIN USER DETECTED!');
            setRole('admin');
            setLoading(false);
          } else {
            // For other users, try database but don't fail if it's broken
            console.log('🔍 [useAuth] Checking database for role...');
            try {
              const { data: userData, error: dbError } = await client
                .from('users')
                .select('role')
                .eq('id', session.user.id)
                .single();
              
              if (dbError) {
                console.warn('⚠️ [useAuth] Database error (using fallback):', dbError.message);
                setRole('user'); // Safe fallback
              } else if (userData?.role) {
                console.log('✅ [useAuth] Database role:', userData.role);
                setRole(userData.role as UserRole);
              } else {
                console.log('ℹ️ [useAuth] No role in DB, defaulting to user');
                setRole('user');
              }
            } catch (error) {
              console.warn('⚠️ [useAuth] Database check failed (using fallback):', error);
              setRole('user'); // Safe fallback
            }
            setLoading(false);
          }
        } else {
          console.log('🚪 [useAuth] No session found');
          setUser(null);
          setRole('user');
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ [useAuth] Auth check failed:', error);
        if (mounted) {
          setUser(null);
          setRole('user');
          setLoading(false);
        }
      }
    };

    // Initial check
    checkAuth();

    // Listen for auth changes with error handling
    const { data: { subscription } } = client.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        try {
          console.log('🔄 [useAuth] Auth state changed:', event);
          
          if (session?.user) {
            setUser(session.user);
            
            // Bulletproof admin check on auth change too
            if (session.user.email === 'topcitytickets@gmail.com') {
              console.log('🎯 [useAuth] Admin detected on auth change');
              setRole('admin');
            } else {
              try {
                const { data: userData } = await client
                  .from('users')
                  .select('role')
                  .eq('id', session.user.id)
                  .single();
                
                setRole((userData?.role as UserRole) || 'user');
              } catch (dbError) {
                console.warn('⚠️ [useAuth] DB error on auth change, using fallback:', dbError);
                setRole('user');
              }
            }
          } else {
            setUser(null);
            setRole('user');
          }
          
          // Always set loading to false after auth state change
          if (mounted) {
            setLoading(false);
          }
        } catch (authError) {
          console.warn('⚠️ [useAuth] Auth change handler error:', authError);
          // Don't fail completely, just log the error
          if (session?.user) {
            setUser(session.user);
            // Fallback to basic detection
            if (session.user.email === 'topcitytickets@gmail.com') {
              setRole('admin');
            } else {
              setRole('user');
            }
          } else {
            setUser(null);
            setRole('user');
          }
          
          // Always set loading to false even on error
          if (mounted) {
            setLoading(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
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
    isUser: role === 'user',
  };
}

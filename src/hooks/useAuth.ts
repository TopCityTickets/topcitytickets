"use client";

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export type UserRole = 'customer' | 'seller' | 'admin';

// Global state to prevent multiple instances
let globalAuthState: {
  user: User | null;
  role: UserRole;
  loading: boolean;
  initialized: boolean;
} = {
  user: null,
  role: 'customer',
  loading: true,
  initialized: false
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(globalAuthState.user);
  const [role, setRole] = useState<UserRole>(globalAuthState.role);
  const [loading, setLoading] = useState<boolean>(globalAuthState.loading);
  const initializationAttempted = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    // Prevent multiple initializations
    if (initializationAttempted.current || globalAuthState.initialized) {
      // Use existing global state
      setUser(globalAuthState.user);
      setRole(globalAuthState.role);
      setLoading(globalAuthState.loading);
      return;
    }

    initializationAttempted.current = true;
    const client = createClient();

    const updateGlobalState = (newUser: User | null, newRole: UserRole, newLoading: boolean) => {
      globalAuthState = { user: newUser, role: newRole, loading: newLoading, initialized: true };
      if (mountedRef.current) {
        setUser(newUser);
        setRole(newRole);
        setLoading(newLoading);
      }
    };

    const checkAuth = async () => {
      try {
        console.log('🔍 [useAuth] Single auth check starting...');
        
        const { data: { session }, error } = await client.auth.getSession();
        
        if (error) {
          console.warn('⚠️ [useAuth] Session error, using fallback:', error.message);
          updateGlobalState(null, 'customer', false);
          return;
        }

        if (session?.user) {
          console.log('✅ [useAuth] User found:', session.user.email);
          
          // Quick admin check
          if (session.user.email === 'topcitytickets@gmail.com') {
            console.log('🎯 [useAuth] Admin detected');
            updateGlobalState(session.user, 'admin', false);
          } else {
            // For regular users, try quick DB check but don't block
            updateGlobalState(session.user, 'customer', false);
            
            // Async role update (non-blocking)
            (async () => {
              try {
                const { data, error } = await client
                  .from('users')
                  .select('role')
                  .eq('id', session.user.id)
                  .single();
                  
                if (!error && data?.role && mountedRef.current) {
                  const dbRole = data.role as UserRole;
                  console.log('✅ [useAuth] Updated role from DB:', dbRole);
                  globalAuthState.role = dbRole;
                  setRole(dbRole);
                }
              } catch (err) {
                console.warn('⚠️ [useAuth] DB role check failed:', err);
              }
            })();
          }
        } else {
          console.log('🚪 [useAuth] No session found');
          updateGlobalState(null, 'customer', false);
        }
      } catch (error) {
        console.error('❌ [useAuth] Auth check failed:', error);
        updateGlobalState(null, 'customer', false);
      }
    };

    // Single timeout for the entire app
    const timeoutId = setTimeout(() => {
      if (!globalAuthState.initialized) {
        console.warn('⏰ [useAuth] Auth timeout - using fallback state');
        updateGlobalState(null, 'customer', false);
      }
    }, 3000);

    // Start auth check
    checkAuth();

    // Single auth listener for the entire app
    const { data: { subscription } } = client.auth.onAuthStateChange(
      (event: any, session: any) => {
        if (!mountedRef.current) return;
        
        console.log('🔄 [useAuth] Auth state changed:', event);
        
        if (session?.user) {
          const newRole = session.user.email === 'topcitytickets@gmail.com' ? 'admin' : 'customer';
          updateGlobalState(session.user, newRole, false);
        } else {
          updateGlobalState(null, 'customer', false);
        }
      }
    );

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []); // Keep empty deps

  useEffect(() => {
    return () => {
      mountedRef.current = false;
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

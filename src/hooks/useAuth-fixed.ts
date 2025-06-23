"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import type { User } from '@supabase/supabase-js';

export type UserRole = 'user' | 'seller' | 'admin';

interface AuthState {
  user: User | null;
  role: UserRole;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    role: 'user',
    loading: true
  });

  useEffect(() => {
    const client = supabase();
    let mounted = true;
    let initialized = false;

    // Get user role from database
    const getUserRole = async (userId: string): Promise<UserRole> => {
      try {
        const { data } = await client
          .from('users')
          .select('role')
          .eq('id', userId)
          .single();
        return (data?.role as UserRole) || 'user';
      } catch (error) {
        console.error('Error fetching role:', error);
        return 'user';
      }
    };

    // Initial session check
    const checkInitialSession = async () => {
      if (initialized) return;
      
      try {
        const { data: { session } } = await client.auth.getSession();
        
        if (!mounted) return;

        if (session?.user) {
          const role = await getUserRole(session.user.id);
          if (mounted) {
            setState({ user: session.user, role, loading: false });
          }
        } else {
          if (mounted) {
            setState({ user: null, role: 'user', loading: false });
          }
        }
        initialized = true;
      } catch (error) {
        console.error('Auth session error:', error);
        if (mounted) {
          setState({ user: null, role: 'user', loading: false });
        }
        initialized = true;
      }
    };

    // Set up auth state listener  
    const { data: { subscription } } = client.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        // Don't process initial session twice
        if (!initialized && event === 'INITIAL_SESSION') {
          return;
        }
        
        if (session?.user) {
          const role = await getUserRole(session.user.id);
          if (mounted) {
            setState({ user: session.user, role, loading: false });
          }
        } else {
          if (mounted) {
            setState({ user: null, role: 'user', loading: false });
          }
        }
      }
    );

    // Check initial session once
    checkInitialSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    user: state.user,
    role: state.role,
    loading: state.loading,
    isAuthenticated: !!state.user,
    isAdmin: state.role === 'admin',
    isSeller: state.role === 'seller',
    isUser: state.role === 'user'
  };
}

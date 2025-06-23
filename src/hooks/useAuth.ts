"use client";

import { useState, useEffect, useRef } from 'react';
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
  const initialized = useRef(false);

  useEffect(() => {
    let mounted = true;
    const client = supabase();

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

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await client.auth.getSession();
        if (!mounted) return;
        
        if (session?.user) {
          const role = await getUserRole(session.user.id);
          if (!mounted) return;
          setState({ user: session.user, role, loading: false });
        } else {
          setState({ user: null, role: 'user', loading: false });
        }
        initialized.current = true;
      } catch (error) {
        console.error('Auth error:', error);
        if (!mounted) return;
        setState({ user: null, role: 'user', loading: false });
        initialized.current = true;
      }
    };

    // Auth state listener
    const { data: { subscription } } = client.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        if (session?.user) {
          const role = await getUserRole(session.user.id);
          if (!mounted) return;
          setState({ user: session.user, role, loading: false });
        } else {
          setState({ user: null, role: 'user', loading: false });
        }
      }
    );

    if (!initialized.current) {
      getInitialSession();
    }

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // Remove the initialized dependency

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

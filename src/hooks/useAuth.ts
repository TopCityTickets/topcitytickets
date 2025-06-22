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

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await client.auth.getSession();
        if (session?.user) {
          const role = await getUserRole(session.user.id);
          setState({ user: session.user, role, loading: false });
        } else {
          setState({ user: null, role: 'user', loading: false });
        }
      } catch (error) {
        console.error('Auth error:', error);
        setState({ user: null, role: 'user', loading: false });
      }
    };

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

    // Auth state listener
    const { data: { subscription } } = client.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const role = await getUserRole(session.user.id);
          setState({ user: session.user, role, loading: false });
        } else {
          setState({ user: null, role: 'user', loading: false });
        }
      }
    );

    getInitialSession();

    return () => subscription.unsubscribe();
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

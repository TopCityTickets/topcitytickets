"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types';

type UserRole = 'user' | 'seller' | 'admin';

interface AuthState {
  user: User | null;
  role: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  profile: Database['public']['Tables']['profiles']['Row'] | null;
}

const AuthContext = createContext<AuthState>({
  user: null,
  role: null,
  isLoading: true,
  isAuthenticated: false,
  profile: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    role: null,
    isLoading: true,
    isAuthenticated: false,
    profile: null,
  });

  useEffect(() => {
    const setupAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        setAuthState({
          user: session.user,
          role: (profile?.role as UserRole) || 'user',
          isLoading: false,
          isAuthenticated: true,
          profile,
        });

        // Handle first-time login
        if (!profile?.setup_completed) {
          router.push('/welcome');
        }
      } else {
        setAuthState({
          user: null,
          role: null,
          isLoading: false,
          isAuthenticated: false,
          profile: null,
        });
      }
    };

    setupAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        setAuthState({
          user: session.user,
          role: (profile?.role as UserRole) || 'user',
          isLoading: false,
          isAuthenticated: true,
          profile,
        });

        // Handle first-time login
        if (!profile?.setup_completed) {
          router.push('/welcome');
        }
      } else {
        setAuthState({
          user: null,
          role: null,
          isLoading: false,
          isAuthenticated: false,
          profile: null,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import type { Database } from '@/types/database.types';

type SupabaseContext = {
  user: any | null;
  role: 'user' | 'seller' | 'admin' | null;
  supabaseClient: ReturnType<typeof supabase>;
};

const SupabaseContext = createContext<SupabaseContext>({
  user: null,
  role: null,
  supabaseClient: supabase(),
});

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<'user' | 'seller' | 'admin' | null>(null);
  const supabaseClient = supabase();

  useEffect(() => {
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          const { data } = await supabaseClient
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();
          setRole(data?.role || 'user');
        } else {
          setUser(null);
          setRole(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <SupabaseContext.Provider value={{ user, role, supabaseClient }}>
      {children}
    </SupabaseContext.Provider>
  );
}

export const useSupabase = () => useContext(SupabaseContext);

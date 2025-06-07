import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import type { Database } from '@/types/database.types';

export function useSupabase() {
  const [client] = useState(() => supabase());
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<'user' | 'seller' | 'admin'>('user');

  useEffect(() => {
    const { data: { subscription } } = client.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          const { data } = await client
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();
          if (data) setRole(data.role);
        } else {
          setUser(null);
          setRole('user');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [client]);

  return { client, user, role };
}

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';

export function useAuth() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const supabaseClient = supabase();
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabaseClient
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        setIsAdmin(profile?.role === 'admin');
        setIsSeller(profile?.role === 'seller');
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  return { isAdmin, isSeller, loading };
}

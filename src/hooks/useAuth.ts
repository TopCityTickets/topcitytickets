import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import type { User } from '@supabase/supabase-js';
import type { UserRole } from '@/types/auth';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('user');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const client = supabase();
    
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await client.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await getUserRole(session.user.id);
      }
      setLoading(false);
    };

    // Get user role from database
    const getUserRole = async (userId: string) => {
      try {
        const { data, error } = await client
          .from('users')
          .select('role')
          .match({ id: userId })
          .single();
        
        if (!error && data && typeof data === 'object' && 'role' in data) {
          setUserRole(data.role as UserRole);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      }
    };

    // Listen for auth changes
    const { data: { subscription } } = client.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          await getUserRole(session.user.id);
        } else {
          setUser(null);
          setUserRole('user');
        }
        setLoading(false);
      }
    );

    getSession();

    return () => subscription.unsubscribe();
  }, []);

  return {
    user,
    userRole,
    loading,
    isLoading: loading,
    isAdmin: userRole === 'admin',
    isSeller: userRole === 'seller',
    isAuthenticated: !!user
  };
}

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
        const { data: { session } } = await client.auth.getSession();
        
        if (!mounted) return;

        if (session?.user) {
          setUser(session.user);
          
          // Check if this is the admin email - hardcode for reliability
          if (session.user.email === 'topcitytickets@gmail.com') {
            setRole('admin');
            console.log('🎯 Admin user detected:', session.user.email);
          } else {
            // For other users, check database
            try {
              const { data: userData } = await client
                .from('users')
                .select('role')
                .eq('id', session.user.id)
                .single();
              
              if (userData?.role) {
                setRole(userData.role as UserRole);
                console.log('🎯 Database role:', userData.role);
              } else {
                setRole('user');
                console.log('🎯 No role found, defaulting to user');
              }
            } catch (error) {
              console.log('🎯 Role check error, defaulting to user:', error);
              setRole('user');
            }
          }
        } else {
          setUser(null);
          setRole('user');
          console.log('🎯 No session found');
        }
      } catch (error) {
        console.error('🎯 Auth error:', error);
        if (mounted) {
          setUser(null);
          setRole('user');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Initial check
    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = client.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('🎯 Auth changed:', event);
        
        if (session?.user) {
          setUser(session.user);
          
          // Hardcode admin check
          if (session.user.email === 'topcitytickets@gmail.com') {
            setRole('admin');
          } else {
            try {
              const { data: userData } = await client
                .from('users')
                .select('role')
                .eq('id', session.user.id)
                .single();
              
              setRole((userData?.role as UserRole) || 'user');
            } catch {
              setRole('user');
            }
          }
        } else {
          setUser(null);
          setRole('user');
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

  console.log('🎯 Auth State:', { 
    email: user?.email, 
    role, 
    isAdmin, 
    isSeller, 
    loading 
  });

  return {
    user,
    role,
    isAdmin,
    isSeller,
    loading,
  };
}

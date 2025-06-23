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

    // Simple session check with timeout
    const checkAuth = async () => {
      try {
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth timeout')), 5000)
        );

        const authPromise = client.auth.getSession();
        
        const { data: { session } } = await Promise.race([authPromise, timeoutPromise]) as any;

        if (session?.user) {
          setUser(session.user);
          
          // Get role with fallback
          try {
            const { data } = await client
              .from('users')
              .select('role')
              .eq('id', session.user.id)
              .single();
            setRole((data?.role as UserRole) || 'user');
          } catch {
            setRole('user'); // Fallback on error
          }
        } else {
          setUser(null);
          setRole('user');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
        setRole('user');
      } finally {
        setLoading(false);
      }
    };

    // Check auth immediately
    checkAuth();

    // Listen for auth changes (simplified)
    const { data: { subscription } } = client.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser(session.user);          // Quick role check without blocking  
          const roleCheck = async () => {
            try {
              const { data } = await client
                .from('users')
                .select('role')
                .eq('id', session.user.id)
                .single();
              setRole((data?.role as UserRole) || 'user');
            } catch {
              setRole('user');
            }
          };
          roleCheck();
        } else {
          setUser(null);
          setRole('user');
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    role,
    loading,
    isAuthenticated: !!user,
    isAdmin: role === 'admin',
    isSeller: role === 'seller',
    isUser: role === 'user'
  };
}

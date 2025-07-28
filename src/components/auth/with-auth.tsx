"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export function withAuth(Component: React.ComponentType<any>) {
  return function ProtectedRoute(props: any) {
    const router = useRouter();
    const supabase = createClientComponentClient();

    useEffect(() => {
      const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          const currentPath = window.location.pathname;
          router.replace(`/login?redirectTo=${encodeURIComponent(currentPath)}`);
          return;
        }

        // Check user role and profile completion if needed
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, setup_completed')
          .eq('id', session.user.id)
          .single();

        if (!profile?.setup_completed && window.location.pathname !== '/welcome') {
          router.replace('/welcome');
          return;
        }
      };

      checkAuth();
    }, [router, supabase]);

    return <Component {...props} />;
  };
}

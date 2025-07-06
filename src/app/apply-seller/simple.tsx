"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ApplySellerSimple() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    // Simple auth check without imports
    const checkAuth = async () => {
      try {
        // Dynamic import to avoid build issues
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (user) {
          setUser(user);
        }
        setLoading(false);
      } catch (error) {
        console.error('Auth error:', error);
        setLoading(false);
      }
    };

    if (typeof window !== 'undefined') {
      checkAuth();
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="mb-4">Please sign in to apply as a seller.</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8 text-center">Apply to Become a Seller</h1>
        <div className="bg-gray-900 p-6 rounded-lg">
          <p className="text-green-400 mb-4">Coming soon - simple seller application form</p>
          <p className="text-gray-300">User: {user.email}</p>
        </div>
      </div>
    </div>
  );
}

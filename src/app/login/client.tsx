"use client";

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

// Force dynamic rendering  
export const dynamic = 'force-dynamic';

export default function LoginClient() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (!email || !password) {
      setMessage('Email and password are required');
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(`Login failed: ${error.message}`);
      } else if (data.user) {
        // Get user role to redirect appropriately
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .single();

        const role = userData?.role;
        
        // Redirect based on role
        if (role === 'admin') {
          router.push('/admin/dashboard');
        } else if (role === 'seller') {
          router.push('/seller/dashboard');
        } else {
          router.push('/dashboard');
        }
      }

    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="max-w-md w-full mx-4 p-6 bg-gray-900 rounded-lg">
        <h1 className="text-2xl font-bold mb-6 text-center">Sign In</h1>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-600"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {message && (
          <div className="mt-4 p-3 rounded text-sm bg-red-900 text-red-300">
            {message}
          </div>
        )}

        <div className="mt-4 text-center">
          <p className="text-gray-400">
            Don't have an account?{' '}
            <button
              onClick={() => router.push('/signup')}
              className="text-blue-400 hover:text-blue-300"
            >
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

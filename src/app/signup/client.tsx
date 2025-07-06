"use client";

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function SignupClient() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Basic validation
    if (!email || !password || !firstName || !lastName) {
      setMessage('All fields are required');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setMessage('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      
      // Sign up with Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          }
        }
      });

      if (error) {
        setMessage(`Signup failed: ${error.message}`);
      } else if (data.user) {
        setMessage('Account created successfully! Please check your email for confirmation, then you can sign in.');
        // Clear form
        setEmail('');
        setPassword('');
        setFirstName('');
        setLastName('');
      } else {
        setMessage('Unexpected signup result');
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
        <h1 className="text-2xl font-bold mb-6 text-center">Create Account</h1>
        
        <form onSubmit={handleSignup} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                required
              />
            </div>
          </div>
          
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
              minLength={6}
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-600"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        {message && (
          <div className={`mt-4 p-3 rounded text-sm ${
            message.includes('successfully') ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
          }`}>
            {message}
          </div>
        )}

        <div className="mt-4 text-center">
          <p className="text-gray-400">
            Already have an account?{' '}
            <button
              onClick={() => router.push('/login')}
              className="text-blue-400 hover:text-blue-300"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

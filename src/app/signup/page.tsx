"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { authActions } from "@/lib/actions/auth";

export default function SignUpPage() {
  const router = useRouter();
  
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResendOption, setShowResendOption] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setShowResendOption(false);
    
    try {
      await authActions.signUp(email, password, fullName);
      
      // Show success message and redirect
      alert("Account created successfully! Please check your email to verify your account, then you can log in.");
      router.push(`/auth/verify?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      console.error("Sign up error:", err);
      const errorMessage = err.message || "An unexpected error occurred";
      setError(errorMessage);
      
      // If error suggests user already exists, show resend option
      if (errorMessage.includes('already') || errorMessage.includes('registered') || errorMessage.includes('exists')) {
        setShowResendOption(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRestartSignup = async () => {
    if (!email) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/restart-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (result.success) {
        setError(null);
        setShowResendOption(false);
        alert(`${result.message}\n\nPlease check your email and try signing up again if needed.`);
        if (result.action === 'resent') {
          router.push(`/auth/verify?email=${encodeURIComponent(email)}`);
        }
      } else {
        setError(`Unable to restart: ${result.error}`);
      }
    } catch (error: any) {
      console.error('Error restarting signup:', error);
      setError('Failed to restart signup process. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 p-4">
      <div className="max-w-md w-full space-y-8 bg-slate-800 p-8 rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-white">
            Welcome to Top City Tickets
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            A local ticket platform for Topeka, Kansas. Create an account to get started.
          </p>
        </div>
        <form className="mt-6 space-y-6" onSubmit={handleSignUp}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="full-name" className="sr-only">
                Full Name
              </label>
              <input
                id="full-name"
                name="fullName"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-400 text-white bg-gray-800 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-400 text-white bg-gray-800 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-400 text-white bg-gray-800 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
              {showResendOption && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={handleRestartSignup}
                    disabled={loading}
                    className="text-sm underline text-red-600 hover:text-red-800 disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : 'Restart signup process'}
                  </button>
                </div>
              )}
            </div>
          )}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing up…" : "Sign up"}
            </button>
          </div>
        </form>
        <p className="mt-4 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <a
            href="/login"
            className="font-medium text-blue-400 hover:text-blue-300"
          >
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}

"use client"
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function HomePage() {
  const supabase = createClientComponentClient();
  const [session, setSession] = useState<any>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, [supabase]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-2xl text-center space-y-6">
        <h1 className="text-5xl font-extrabold text-white">Welcome to Top City Tickets</h1>
        <p className="text-slate-300 text-lg">Your one-stop platform for selling and discovering events.</p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/events" className="bg-primary text-white font-semibold py-3 px-6 rounded-lg hover:opacity-90">Browse Events</Link>
          <Link href={session ? "/dashboard" : "/login"} className="bg-secondary text-white font-semibold py-3 px-6 rounded-lg hover:opacity-90">
            {session ? "Go to Dashboard" : "Login / Sign Up"}
          </Link>
        </div>
        <Link href="/apply-seller" className="block text-sm text-slate-400 hover:underline">
          Want to sell tickets? Become a Seller
        </Link>
      </div>
    </div>
  );
}
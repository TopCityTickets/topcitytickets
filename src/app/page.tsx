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
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a13] relative overflow-hidden">
      {/* Animated neon gradient background */}
      <div className="absolute inset-0 z-0 animate-gradient-x bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-purple-900 via-indigo-900 to-[#0a0a13] opacity-90"></div>
      {/* Neon particles (optional, subtle) */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none">
        <svg width="100%" height="100%" className="w-full h-full opacity-30">
          <circle cx="20%" cy="30%" r="40" fill="#6b5bff" />
          <circle cx="80%" cy="70%" r="30" fill="#feb236" />
          <circle cx="60%" cy="20%" r="20" fill="#00ffe7" />
        </svg>
      </div>
      <div className="relative z-10 w-full max-w-xl mx-auto">
        <div className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-3xl shadow-2xl px-8 py-14 text-center space-y-10 ring-2 ring-purple-700/40">
          <div className="flex justify-center mb-2">
            <span className="inline-block bg-gradient-to-r from-[#00ffe7] to-[#6b5bff] rounded-full p-3 shadow-lg ring-2 ring-[#00ffe7]/40 animate-pulse">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-[#00ffe7]"><path d="M12 2L15 8H9L12 2ZM12 22C10.3431 22 9 20.6569 9 19C9 17.3431 10.3431 16 12 16C13.6569 16 15 17.3431 15 19C15 20.6569 13.6569 22 12 22ZM2 12L8 15V9L2 12ZM22 12L16 9V15L22 12Z" fill="currentColor"/></svg>
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#00ffe7] via-[#6b5bff] to-[#feb236] drop-shadow-[0_0_16px_#00ffe7]">
            Top City Tickets
          </h1>
          <p className="text-slate-200 text-lg md:text-2xl font-medium max-w-xl mx-auto">
            Discover, sell, and manage tickets for the best events in your city.<br />
            <span className="text-[#00ffe7] font-semibold">Fast</span>, <span className="text-[#feb236] font-semibold">secure</span>, and <span className="text-[#6b5bff] font-semibold">easy</span>.
          </p>
          <div className="flex flex-wrap justify-center gap-6 mt-6">
            <Link href="/events" className="bg-[#00ffe7] text-[#0a0a13] font-bold py-3 px-8 rounded-xl shadow-xl hover:scale-105 hover:bg-[#6b5bff] hover:text-white transition-all text-lg ring-2 ring-[#00ffe7]/40">
              Browse Events
            </Link>
            <Link href={session ? "/dashboard" : "/login"} className="bg-[#6b5bff] text-white font-bold py-3 px-8 rounded-xl shadow-xl hover:scale-105 hover:bg-[#feb236] hover:text-[#0a0a13] transition-all text-lg ring-2 ring-[#6b5bff]/40">
              {session ? "Go to Dashboard" : "Login / Sign Up"}
            </Link>
          </div>
          <Link href="/apply-seller" className="inline-block text-sm text-[#feb236] hover:underline mt-2 drop-shadow-[0_0_8px_#feb236]">
            Want to sell tickets? <span className="font-semibold">Become a Seller</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
"use client";
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function Navbar() {
  const supabase = createClientComponentClient();
  const [session, setSession] = useState<null | any>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) fetchRole(data.session.user.id);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setSession(session);
      if (session) fetchRole(session.user.id);
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  // Fetch profile role from database
  const fetchRole = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    if (!error && data) setRole(data.role);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <nav className="bg-slate-800 p-4 flex items-center justify-between">
      <Link href="/" className="text-white text-xl font-bold">
        Top City Tickets
      </Link>
      <div className="space-x-4">
        <Link href="/events" className="text-slate-200 hover:text-white">
          Events
        </Link>
        {/* Role-based navigation */}
        {session && role === 'user' && (
          <Link href="/apply-seller" className="text-slate-200 hover:text-white">
            Become a Seller
          </Link>
        )}
        {session && role === 'seller' && (
          <Link href="/seller/dashboard" className="text-slate-200 hover:text-white">
            Seller Dashboard
          </Link>
        )}
        {session && role === 'admin' && (
          <Link href="/admin/dashboard" className="text-slate-200 hover:text-white">
            Admin Dashboard
          </Link>
        )}
        {session ? (
          <>
            <Link href="/dashboard" className="text-slate-200 hover:text-white">
              Dashboard
            </Link>
            <button onClick={signOut} className="text-slate-200 hover:text-white">
              Sign Out
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="text-slate-200 hover:text-white">
              Login
            </Link>
            <Link href="/signup" className="text-slate-200 hover:text-white">
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

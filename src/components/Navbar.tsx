"use client";
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function Navbar() {
  const supabase = createClientComponentClient();
  const [session, setSession] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Fetch profile role from database
  async function fetchRole(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    if (!error && data) setRole(data.role);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) fetchRole(data.session.user.id);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setSession(session);
      if (session) fetchRole(session.user.id);
    });
    return () => listener.subscription.unsubscribe();
  }, [supabase]);

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

  const links = [
    { href: '/events', label: 'Events' },
    session && role === 'user' && { href: '/apply-seller', label: 'Become a Seller' },
    session && role === 'seller' && { href: '/seller/dashboard', label: 'Seller Dashboard' },
    session && role === 'admin' && { href: '/admin/dashboard', label: 'Admin Dashboard' },
  ].filter(Boolean) as { href: string; label: string }[];

  return (
    <nav className="bg-gray-800 fixed w-full z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-white text-xl font-bold">Top City Tickets</Link>
            <div className="hidden md:flex ml-10 space-x-4">
              {links.map(item => (
                <Link key={item.href} href={item.href} className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            {session ? (
              <button onClick={signOut} className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Sign Out</button>
            ) : (
              <>
                <Link href="/login" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Login</Link>
                <Link href="/signup" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Sign Up</Link>
              </>
            )}
          </div>
          <div className="md:hidden">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="text-gray-300 hover:text-white hover:bg-gray-700 inline-flex items-center justify-center p-2 rounded-md focus:outline-none"
            >
              <span className="sr-only">Open main menu</span>
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
              </svg>
            </button>
          </div>
        </div>
      </div>
      {mobileOpen && (
        <div className="md:hidden bg-gray-700 px-2 pt-2 pb-3 space-y-1 sm:px-3">
          {links.map(item => (
            <Link key={item.href} href={item.href} className="block text-gray-300 hover:text-white px-3 py-2 rounded-md text-base font-medium">
              {item.label}
            </Link>
          ))}
          {session ? (
            <button onClick={signOut} className="block w-full text-left text-gray-300 hover:text-white px-3 py-2 rounded-md text-base font-medium">Sign Out</button>
          ) : (
            <>
              <Link href="/login" className="block text-gray-300 hover:text-white px-3 py-2 rounded-md text-base font-medium">Login</Link>
              <Link href="/signup" className="block text-gray-300 hover:text-white px-3 py-2 rounded-md text-base font-medium">Sign Up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

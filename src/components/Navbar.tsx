"use client";

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from './providers/AuthProvider';
import { Button } from './ui/button';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface NavItem {
  href: string;
  label: string;
}

export default function Navbar() {
  const { isAuthenticated, role, profile } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const supabase = createClientComponentClient();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navItems: NavItem[] = [
    { href: '/events', label: 'Events' },
    ...(isAuthenticated ? [{ href: '/dashboard', label: 'Dashboard' }] : []),
    ...(isAuthenticated && role === 'user' ? [{ href: '/apply-seller', label: 'Become a Seller' }] : []),
    ...(isAuthenticated && role === 'seller' ? [{ href: '/seller/dashboard', label: 'Seller Dashboard' }] : []),
    ...(isAuthenticated && role === 'admin' ? [{ href: '/admin/dashboard', label: 'Admin Dashboard' }] : []),
  ];

  return (
    <nav className="bg-black/90 backdrop-blur-md fixed w-full z-50 shadow-2xl border-b border-cyan-400/20 top-0">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex justify-between items-center h-16">
          {/* Logo - moved in from edge */}
          <div className="flex-shrink-0 ml-8">
            <Link href="/" className="text-xl font-black tracking-wider hover:scale-105 transition-transform">
              <span className="text-cyan-400 drop-shadow-[0_0_10px_#00ffff]">TOP</span>
              <span className="text-pink-400 drop-shadow-[0_0_10px_#ff1493] ml-1">CITY</span>
            </Link>
          </div>
          
          {/* Desktop navigation - better spacing */}
          <div className="hidden md:flex space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-gray-300 hover:text-cyan-400 px-3 py-2 text-sm font-medium transition-all duration-300 hover:drop-shadow-[0_0_8px_#00ffff] relative group"
              >
                {item.label}
                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-pink-400 group-hover:w-full transition-all duration-300"></div>
              </Link>
            ))}
          </div>
          
          {/* Right side buttons - moved in from edge */}
          <div className="flex items-center space-x-4 mr-8">
            {isAuthenticated ? (
              <button
                onClick={handleSignOut}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:shadow-lg hover:shadow-red-500/25"
              >
                Sign Out
              </button>
            ) : (
              <Link
                href="/login"
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/25"
              >
                Login
              </Link>
            )}
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-400 hover:text-cyan-400 focus:outline-none transition-colors duration-300"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-black/95 backdrop-blur-lg rounded-lg mt-2 border border-cyan-400/20">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-gray-300 hover:text-cyan-400 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-300"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    handleSignOut();
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-gray-300 hover:text-red-400 block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors duration-300"
                >
                  Sign Out
                </button>
              ) : (
                <Link
                  href="/login"
                  className="text-gray-300 hover:text-cyan-400 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-300"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

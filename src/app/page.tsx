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
    <div className="min-h-[calc(100vh-4rem)] relative overflow-hidden">
      {/* Hardcore downtown night background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-slate-900 to-gray-900"></div>
      
      {/* Animated background particles */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-cyan-400 animate-ping"></div>
        <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-pink-400 animate-ping animation-delay-1000"></div>
        <div className="absolute top-1/2 left-1/3 w-1 h-1 bg-yellow-400 animate-ping animation-delay-2000"></div>
        <div className="absolute top-3/4 right-1/3 w-1 h-1 bg-purple-400 animate-ping animation-delay-3000"></div>
        <div className="absolute top-1/5 right-1/5 w-1 h-1 bg-green-400 animate-ping animation-delay-500"></div>
      </div>
      {/* Downtown skyline silhouette */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black via-slate-900 to-transparent z-10">
        <svg className="absolute bottom-0 w-full h-full" viewBox="0 0 800 200" preserveAspectRatio="none">
          <polygon points="0,200 80,120 120,140 160,80 200,100 240,60 280,90 320,40 360,70 400,30 440,55 480,25 520,45 560,20 600,35 640,15 680,25 720,10 760,20 800,5 800,200" 
                   fill="url(#skylineGradient)" />
          <defs>
            <linearGradient id="skylineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
          </defs>
        </svg>
        {/* Building windows - neon lights */}
        <div className="absolute inset-0">
          <div className="absolute bottom-20 left-16 w-1 h-8 bg-cyan-400 animate-pulse shadow-lg shadow-cyan-400/50"></div>
          <div className="absolute bottom-32 left-24 w-1 h-6 bg-pink-400 animate-pulse shadow-lg shadow-pink-400/50"></div>
          <div className="absolute bottom-28 left-40 w-1 h-10 bg-yellow-400 animate-pulse shadow-lg shadow-yellow-400/50"></div>
          <div className="absolute bottom-16 left-60 w-1 h-12 bg-purple-400 animate-pulse shadow-lg shadow-purple-400/50"></div>
          <div className="absolute bottom-24 left-80 w-1 h-8 bg-green-400 animate-pulse shadow-lg shadow-green-400/50"></div>
          <div className="absolute bottom-40 left-96 w-1 h-14 bg-blue-400 animate-pulse shadow-lg shadow-blue-400/50"></div>
          <div className="absolute bottom-18 left-[28rem] w-1 h-10 bg-red-400 animate-pulse shadow-lg shadow-red-400/50"></div>
          <div className="absolute bottom-30 left-[32rem] w-1 h-6 bg-cyan-400 animate-pulse shadow-lg shadow-cyan-400/50"></div>
          <div className="absolute bottom-22 left-[36rem] w-1 h-12 bg-pink-400 animate-pulse shadow-lg shadow-pink-400/50"></div>
        </div>
      </div>

      {/* Neon grid pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="h-full w-full" style={{
          backgroundImage: `
            linear-gradient(cyan 1px, transparent 1px),
            linear-gradient(90deg, cyan 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      {/* Street lights effect */}
      <div className="absolute top-1/3 left-10 w-2 h-32 bg-gradient-to-b from-yellow-300 to-transparent opacity-60 blur-sm"></div>
      <div className="absolute top-1/4 right-20 w-2 h-40 bg-gradient-to-b from-white to-transparent opacity-40 blur-sm"></div>
      <div className="absolute top-1/2 left-1/3 w-2 h-36 bg-gradient-to-b from-blue-300 to-transparent opacity-50 blur-sm"></div>

      {/* Main content */}
      <div className="relative z-20 flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
        <div className="text-center max-w-4xl mx-auto">
          {/* TOP CITY neon sign - more reasonable sizing */}
          <div className="mb-12">
            <h1 className="text-6xl md:text-8xl font-black tracking-widest mb-6 leading-none">
              <span className="inline-block text-neon-cyan drop-shadow-neon-cyan animate-neon-pulse font-mono">TOP</span>
              <br className="md:hidden" />
              <span className="inline-block text-neon-pink drop-shadow-neon-pink animate-neon-pulse md:ml-6 font-mono">CITY</span>
            </h1>
            <div className="h-2 w-48 bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink mx-auto mb-4 animate-neon-flicker shadow-neon-glow rounded-full"></div>
            <h2 className="text-3xl md:text-5xl font-bold text-neon-yellow drop-shadow-neon-yellow tracking-wider animate-neon-pulse font-mono">
              TICKETS
            </h2>
          </div>

          {/* Tagline */}
          <p className="text-2xl md:text-3xl text-white mb-8 max-w-2xl mx-auto leading-relaxed font-semibold tracking-wide">
            The <span className="text-cyan-400 drop-shadow-neon-cyan">heartbeat</span> of Topeka's nightlife.<br />
            Where the <span className="text-pink-400 drop-shadow-neon-pink">capital city</span> comes alive after dark.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-8">
            <Link href="/events" 
                  className="group relative px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-lg rounded-lg overflow-hidden transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative flex items-center">
                🌃 Explore Events
              </span>
              <div className="absolute inset-0 border-2 border-cyan-400 rounded-lg opacity-0 group-hover:opacity-100 animate-pulse"></div>
            </Link>
            
            {!session ? (
              <>
                <Link href="/login"
                      className="group relative px-8 py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold text-lg rounded-lg overflow-hidden transition-all duration-300 hover:scale-105">
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative flex items-center">
                    🎭 Login
                  </span>
                  <div className="absolute inset-0 border-2 border-pink-400 rounded-lg opacity-0 group-hover:opacity-100 animate-pulse"></div>
                </Link>

                <Link href="/signup"
                      className="group relative px-8 py-4 bg-gradient-to-r from-yellow-600 to-orange-600 text-white font-bold text-lg rounded-lg overflow-hidden transition-all duration-300 hover:scale-105">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative flex items-center">
                    ✨ Sign Up
                  </span>
                  <div className="absolute inset-0 border-2 border-yellow-400 rounded-lg opacity-0 group-hover:opacity-100 animate-pulse"></div>
                </Link>
              </>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/profile"
                      className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-lg rounded-lg overflow-hidden transition-all duration-300 hover:scale-105">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative flex items-center">
                    👤 Profile
                  </span>
                  <div className="absolute inset-0 border-2 border-purple-400 rounded-lg opacity-0 group-hover:opacity-100 animate-pulse"></div>
                </Link>
              </div>
            )}
          </div>

          {/* Seller CTA */}
          {session ? (
            <div className="text-center space-y-4">
              <Link href="/seller/dashboard" 
                    className="inline-flex items-center text-cyan-400 hover:text-cyan-300 transition-colors font-medium mr-6">
                <span className="mr-2">🎫</span>
                Seller Dashboard
                <span className="ml-1 font-bold underline decoration-cyan-400">Manage Events</span>
              </Link>
              <Link href="/apply-seller" 
                    className="inline-flex items-center text-yellow-400 hover:text-yellow-300 transition-colors font-medium">
                <span className="mr-2">💰</span>
                Ready to light up the night? 
                <span className="ml-1 font-bold underline decoration-yellow-400">Become a Seller</span>
              </Link>
            </div>
          ) : (
            <div className="text-center">
              <Link href="/login" 
                    className="inline-flex items-center text-yellow-400 hover:text-yellow-300 transition-colors font-medium">
                <span className="mr-2">💰</span>
                Ready to light up the night? 
                <span className="ml-1 font-bold underline decoration-yellow-400">Login to Get Started</span>
              </Link>
            </div>
          )}

          {/* Location badge */}
          <div className="mt-12 flex justify-center">
            <div className="px-4 py-2 bg-black/40 border border-gray-700 rounded-full backdrop-blur-sm">
              <span className="text-gray-400 text-sm">📍 Downtown Topeka, Kansas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating neon elements */}
      <div className="absolute top-20 left-16 w-4 h-4 bg-cyan-400 rounded-full animate-ping"></div>
      <div className="absolute top-32 right-24 w-3 h-3 bg-pink-400 rounded-full animate-pulse"></div>
      <div className="absolute bottom-64 left-32 w-2 h-2 bg-yellow-400 rounded-full animate-bounce"></div>
      <div className="absolute bottom-80 right-16 w-5 h-5 bg-purple-400 rounded-full animate-pulse"></div>
    </div>
  );
}
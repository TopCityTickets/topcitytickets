﻿"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { withAuth } from '@/components/auth/with-auth';
import { Button } from '@/components/ui/button';

function UserDashboard() {
  const supabase = createClientComponentClient();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sellerApplication, setSellerApplication] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get user's profile and role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name, email')
        .eq('id', session.user.id)
        .single();
      
      setUserProfile(profile);

      // Get user's purchased tickets from events
      // Note: This is a placeholder - you'll need to implement ticket purchases
      // For now, we'll just show available events
      const { data: userTickets } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'active');
      
      if (userTickets) {
        setTickets(userTickets);
      }

      // Check for seller application if user is not already a seller
      if (profile?.role === 'user') {
        const { data: application } = await supabase
          .from('seller_applications')
          .select('*')
          .eq('user_id', session.user.id)
          .order('submitted_at', { ascending: false })
          .limit(1)
          .single();
        
        setSellerApplication(application);
      }
      
      setLoading(false);
    };

    loadDashboard();
  }, [supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black to-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-cyan-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-slate-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-8 p-6 bg-black/40 rounded-lg border border-gray-800">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome Back{userProfile?.full_name ? `, ${userProfile.full_name}` : ''}! 👋
          </h1>
          <p className="text-gray-400">Your personal dashboard for managing tickets and events</p>
          <div className="mt-4 text-sm">
            <span className="text-gray-500">Email:</span> <span className="text-cyan-400">{userProfile?.email}</span>
            <span className="text-gray-500 ml-4">Role:</span> <span className="text-pink-400 capitalize">{userProfile?.role || 'User'}</span>
          </div>
        </div>

        {/* Role-based Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link href="/events" 
                className="p-6 bg-gradient-to-r from-cyan-900/30 to-blue-900/30 rounded-lg border border-cyan-500/20 hover:from-cyan-900/40 hover:to-blue-900/40 transition-all">
            <h3 className="text-xl font-bold text-cyan-400 mb-2">Browse Events</h3>
            <p className="text-gray-300">Discover upcoming events in Topeka</p>
          </Link>

          <Link href="/profile" 
                className="p-6 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg border border-purple-500/20 hover:from-purple-900/40 hover:to-pink-900/40 transition-all">
            <h3 className="text-xl font-bold text-pink-400 mb-2">Profile Settings</h3>
            <p className="text-gray-300">Update your personal information</p>
          </Link>

          {userProfile?.role === 'seller' && (
            <Link href="/seller/dashboard" 
                  className="p-6 bg-gradient-to-r from-yellow-900/30 to-orange-900/30 rounded-lg border border-yellow-500/20 hover:from-yellow-900/40 hover:to-orange-900/40 transition-all">
              <h3 className="text-xl font-bold text-yellow-400 mb-2">Seller Dashboard</h3>
              <p className="text-gray-300">Manage your events and sales</p>
            </Link>
          )}

          {userProfile?.role === 'admin' && (
            <Link href="/admin/dashboard" 
                  className="p-6 bg-gradient-to-r from-red-900/30 to-orange-900/30 rounded-lg border border-red-500/20 hover:from-red-900/40 hover:to-orange-900/40 transition-all">
              <h3 className="text-xl font-bold text-red-400 mb-2">Admin Panel</h3>
              <p className="text-gray-300">Manage the platform and users</p>
            </Link>
          )}
        </div>

        {/* Seller Application Section */}
        {userProfile?.role === 'user' && (
          <div className="mb-8">
            {!sellerApplication && (
              <div className="p-6 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg border border-purple-500/20">
                <h2 className="text-2xl font-bold text-pink-400 mb-4">Become a Seller</h2>
                <p className="text-gray-300 mb-6">
                  Want to host your own events? Apply to become a seller and start creating unforgettable experiences in Topeka.
                </p>
                <Link href="/apply-seller">
                  <Button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600">
                    Apply Now 
                  </Button>
                </Link>
              </div>
            )}

            {sellerApplication?.status === 'pending' && (
              <div className="p-6 bg-yellow-900/20 rounded-lg border border-yellow-500/20">
                <h2 className="text-xl font-bold text-yellow-400 mb-2">Application in Review</h2>
                <p className="text-gray-300">
                  Your seller application for <span className="text-yellow-400">{sellerApplication.business_name}</span> is currently being reviewed. We'll notify you once a decision has been made.
                  <br />
                  <span className="text-sm">Submitted on: {new Date(sellerApplication.submitted_at).toLocaleDateString()}</span>
                </p>
              </div>
            )}

            {sellerApplication?.status === 'rejected' && (
              <div className="p-6 bg-red-900/20 rounded-lg border border-red-500/20">
                <h2 className="text-xl font-bold text-red-400 mb-2">Application Not Approved</h2>
                <p className="text-gray-300 mb-4">
                  Unfortunately, your seller application was not approved at this time.
                  {sellerApplication.notes && (
                    <span className="block mt-2 text-sm">Reason: {sellerApplication.notes}</span>
                  )}
                </p>
                <Link href="/apply-seller">
                  <Button className="bg-red-500 hover:bg-red-600 text-white">
                    Submit New Application
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}

        <h1 className="text-4xl font-bold mb-6 text-cyan-400">Your Tickets</h1>
        
        {tickets && tickets.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tickets.map((t: any) => (
              <div key={t.id} className="p-6 bg-slate-800/50 backdrop-blur-sm rounded-lg border border-cyan-400/20 hover:border-cyan-400/50 transition-all">
                <h3 className="text-xl font-semibold text-cyan-400 mb-2">{t.title}</h3>
                <div className="space-y-2 text-gray-300">
                  <p>
                    <span className="text-gray-400">Date:</span>{' '}
                    {new Date(t.date).toLocaleDateString()} @ {t.time}
                  </p>
                  <p>
                    <span className="text-gray-400">Venue:</span> {t.venue}
                  </p>
                  <p>
                    <span className="text-gray-400">Price:</span>{' '}
                    <span className="text-pink-400">${t.price}</span>
                  </p>
                  <p>
                    <span className="text-gray-400">Status:</span>{' '}
                    <span className={t.status === 'active' ? 'text-green-400' : 'text-yellow-400'}>
                      {t.status}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-6">You haven't purchased any tickets yet.</p>
            <Link href="/events">
              <Button className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold">
                Browse Events
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default withAuth(UserDashboard);

"use client";

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { eventActions } from '@/lib/actions/event-actions';

interface EventSubmission {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  price: number;
  venue: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  notes?: string;
}

export default function SellerDashboardPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [events, setEvents] = useState<any[]>([]);
  const [eventSubmissions, setEventSubmissions] = useState<EventSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    async function loadSellerDashboard() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsAuthenticated(false);
        router.push('/login');
        return;
      }
      setIsAuthenticated(true);

      // Get seller profile and verify role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      setRole(profile?.role || null);
      
      if (profile?.role !== 'seller' && profile?.role !== 'admin') {
        router.push('/dashboard');
        return;
      }

      // Get event submissions
      const { data: submissions, error: submissionsError } = await supabase
        .from('event_submissions')
        .select('*')
        .eq('seller_id', session.user.id)
        .order('submitted_at', { ascending: false });

      if (submissionsError) {
        console.error('Error fetching submissions:', submissionsError);
        setError('Failed to load event submissions');
      } else {
        setEventSubmissions(submissions || []);
      }

      // Get approved events
      const { data: approvedEvents, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('seller_id', session.user.id)
        .order('date', { ascending: true });

      if (eventsError) {
        console.error('Error fetching events:', eventsError);
        setError('Failed to load events');
      } else {
        setEvents(approvedEvents || []);
      }

      setLoading(false);
    }

    loadSellerDashboard();
  }, [supabase, router]);

  const handleCancelEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to cancel this event?')) return;
    
    try {
      await eventActions.cancelEvent(eventId);
      alert('Event cancelled successfully');
      // Reload the events
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Get approved events
        const { data: approvedEvents, error: eventsError } = await supabase
          .from('events')
          .select('*')
          .eq('seller_id', session.user.id)
          .order('date', { ascending: true });

        if (eventsError) {
          console.error('Error fetching events:', eventsError);
          setError('Failed to load events');
        } else {
          setEvents(approvedEvents || []);
        }
      }
    } catch (err: any) {
      console.error('Error cancelling event:', err);
      alert(err.message || 'Failed to cancel event');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center bg-slate-800 border-slate-700">
          <h1 className="text-2xl font-bold text-white mb-4">Authentication Required</h1>
          <p className="text-slate-300 mb-6">You must be logged in to access the seller dashboard.</p>
          <Button
            onClick={() => router.push('/login')}
            className="w-full bg-primary hover:bg-primary/90"
          >
            Go to Login
          </Button>
        </Card>
      </div>
    );
  }

  if (role !== 'seller' && role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center bg-slate-800 border-slate-700">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-slate-300 mb-6">You must be a seller to access this dashboard.</p>
          <Button
            onClick={() => router.push('/apply-seller')}
            className="w-full bg-primary hover:bg-primary/90"
          >
            Apply to Become a Seller
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold">Seller Dashboard</h1>
              <p className="text-gray-400 mt-2">Manage your events and track your sales</p>
            </div>
            <Link href="/submit-event">
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600">
                Submit New Event
              </Button>
            </Link>
          </div>
        </div>

        {/* Event Submissions Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Event Submissions</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {eventSubmissions.map((submission) => (
              <div key={submission.id} 
                   className={`p-6 rounded-lg border ${
                     submission.status === 'pending' ? 'bg-yellow-900/20 border-yellow-500/20' :
                     submission.status === 'approved' ? 'bg-green-900/20 border-green-500/20' :
                     'bg-red-900/20 border-red-500/20'
                   }`}>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold">{submission.title}</h3>
                  <Badge className={
                    submission.status === 'pending' ? 'bg-yellow-500' :
                    submission.status === 'approved' ? 'bg-green-500' :
                    'bg-red-500'
                  }>
                    {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                  </Badge>
                </div>
                <div className="space-y-2 text-gray-300">
                  <p>📅 {new Date(submission.date).toLocaleDateString()} at {submission.time}</p>
                  <p>📍 {submission.venue}</p>
                  <p>💰 ${submission.price}</p>
                  {submission.notes && (
                    <p className="mt-4 p-3 bg-black/30 rounded">
                      ℹ️ Admin Note: {submission.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {eventSubmissions.length === 0 && (
              <div className="col-span-2 text-center py-8 bg-black/40 rounded-lg">
                <p className="text-gray-400 mb-4">No event submissions yet</p>
                <Link href="/submit-event">
                  <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600">
                    Submit Your First Event
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Live Events Section */}
        <div>
          <h2 className="text-2xl font-semibold mb-6">Live Events</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <div key={event.id} className="p-6 bg-black/40 rounded-lg border border-gray-800">
                <h3 className="text-xl font-semibold mb-2">{event.title}</h3>
                <div className="space-y-2 text-gray-300">
                  <p>📅 {new Date(event.date).toLocaleDateString()} at {event.time}</p>
                  <p>📍 {event.venue}</p>
                  <p>💰 ${event.price}</p>
                  <p>🎟️ {event.tickets_sold || 0}/{event.capacity} tickets sold</p>
                  <div className="mt-4">
                    <Link href={`/seller/events/${event.id}`}
                          className="text-cyan-400 hover:text-cyan-300 transition-colors">
                      View Details →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
            {events.length === 0 && (
              <div className="col-span-3 text-center py-8 bg-black/40 rounded-lg">
                <p className="text-gray-400">No approved events yet</p>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : error ? (
          <Card className="p-6 bg-red-500/10 border-red-500/50">
            <p className="text-red-400 text-center">{error}</p>
            <Button
              onClick={async () => {
  setError(null);
  setLoading(true);
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    const { data: approvedEvents, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .eq('seller_id', session.user.id)
      .order('date', { ascending: true });

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      setError('Failed to load events');
    } else {
      setEvents(approvedEvents || []);
    }
  }
  setLoading(false);
}}
              className="w-full mt-4 bg-red-600 hover:bg-red-700"
            >
              Try Again
            </Button>
          </Card>
        ) : events.length === 0 ? (
          <Card className="p-8 bg-slate-800 border-slate-700 text-center">
            <h3 className="text-xl font-bold text-white mb-4">No Events Yet</h3>
            <p className="text-slate-300 mb-6">
              You haven't created any events yet. Start by creating your first event!
            </p>
            <Link href="/create-event">
              <Button className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                Create Your First Event
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Card key={event.id} className="p-6 bg-slate-800 border-slate-700">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold text-white line-clamp-2">
                      {event.title}
                    </h3>
                    <Badge 
                      variant={event.status === 'active' ? 'default' : 'secondary'}
                      className={
                        event.status === 'active' 
                          ? 'bg-green-600 text-white' 
                          : event.status === 'cancelled'
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-600 text-white'
                      }
                    >
                      {event.status}
                    </Badge>
                  </div>

                  <div className="text-slate-300 text-sm space-y-1">
                    <p>📅 {new Date(event.date).toLocaleDateString()} at {event.time}</p>
                    <p>📍 {event.venue}, {event.location}</p>
                    <p>💰 ${event.price} per ticket</p>
                    <p>🎫 {event.tickets_sold} / {event.capacity} sold</p>
                  </div>

                  {event.description && (
                    <p className="text-slate-400 text-sm line-clamp-2">
                      {event.description}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                      onClick={() => router.push(`/events/${event.id}`)}
                    >
                      View
                    </Button>
                    {event.status === 'active' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                        onClick={() => handleCancelEvent(event.id)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
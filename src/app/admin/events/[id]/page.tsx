"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import type { Database } from '@/types/database.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type EventSubmission = Database['public']['Tables']['event_submissions']['Row'];

export default function AdminEventReview() {
  const params = useParams();
  const eventId = typeof params.id === 'string' ? params.id : params.id?.[0];
  const [event, setEvent] = useState<EventSubmission | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const supabaseClient = supabase();
        const { data, error } = await supabaseClient
          .from('event_submissions')
          .select('*')
          .eq('id', eventId)
          .single();

        if (error) throw error;
        setEvent(data);
      } catch (err) {
        console.error('Error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load event');
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);  const handleApprove = async () => {
    try {
      if (!event) {
        alert('❌ No event data found');
        return;
      }

      console.log('🚀 Starting approval via API for:', event.title);
      console.log('📋 Event ID:', event.id);

      const response = await fetch(`/api/admin/events/${event.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'approve' }),
      });

      console.log('📡 API Response status:', response.status);
      const result = await response.json();
      console.log('📊 API Response data:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Failed to approve event');
      }

      console.log('✅ Approval successful:', result);

      // Refresh the event data to show updated fields
      const supabaseClient = supabase();
      const { data: refreshedEvent, error: refreshError } = await supabaseClient
        .from('event_submissions')
        .select('*')
        .eq('id', event.id)
        .single();

      if (refreshError) {
        console.error('Error refreshing event data:', refreshError);
      } else {
        console.log('🔄 Refreshed event data:', refreshedEvent);
        setEvent(refreshedEvent);
      }
      
      // Show success message with shareable URL
      const eventUrl = `${window.location.origin}${result.eventUrl}`;
      alert(`✅ ${result.message}\n\nThe event "${result.event.title}" is now live and can be found at:\n${eventUrl}\n\nThis URL can be shared for ticket sales.`);
      
    } catch (error: any) {
      console.error('❌ Approval error:', error);
      setError(`Error approving event: ${error.message || 'Unknown error'}`);
      alert(`❌ Error approving event: ${error.message || 'Please try again.'}`);
    }
  };

  const handleReject = async () => {
    try {
      if (!event) {
        alert('❌ No event data found');
        return;
      }

      const response = await fetch(`/api/admin/events/${event.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'reject' }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reject event');
      }

      const updatedEvent: EventSubmission = {
        ...event,
        status: 'rejected'
      };
      
      setEvent(updatedEvent);
      alert(`✅ ${result.message}`);
      
    } catch (error: any) {
      console.error('Rejection error:', error);
      setError(`Error rejecting event: ${error.message || 'Unknown error'}`);
      alert(`❌ Error rejecting event: ${error.message || 'Please try again.'}`);
    }
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-primary/20 rounded w-1/3"></div>
            <div className="h-64 bg-muted/30 rounded"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-black">
        <div className="container mx-auto px-4 py-8">
          <Card className="ultra-dark-card p-6 max-w-2xl mx-auto">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4 text-destructive">Error</h1>
              <p className="text-muted-foreground">{error}</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-black brand-text-gradient mb-8">Review Event Submission</h1>
          
          {event && (
            <div className="space-y-6">
              {/* Event Status */}
              <Card className="ultra-dark-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-2">{event.title}</h2>
                      <p className="text-muted-foreground">
                        Submitted: {new Date(event.created_at || '').toLocaleDateString()}
                      </p>
                    </div>
                    <Badge 
                      variant={
                        event.status === 'pending' ? 'secondary' :
                        event.status === 'approved' ? 'default' : 'destructive'
                      }
                      className="text-lg px-4 py-2"
                    >
                      {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Event Details */}
              <Card className="ultra-dark-card">
                <CardHeader>
                  <CardTitle className="text-white">Event Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-white mb-2">📅 Date & Time</h4>
                        <p className="text-muted-foreground">{event.date} at {event.time}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-white mb-2">📍 Venue</h4>
                        <p className="text-muted-foreground">{event.venue}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-white mb-2">💰 Ticket Price</h4>
                        <p className="text-muted-foreground text-xl font-bold">${event.ticket_price}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-white mb-2">👤 Organizer</h4>
                        <p className="text-muted-foreground">{event.organizer_email}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-white mb-2">📝 Description</h4>
                      <div className="bg-muted/10 p-4 rounded-lg">
                        <p className="text-muted-foreground leading-relaxed">{event.description}</p>
                      </div>
                      
                      {event.image_url && (
                        <div className="mt-4">
                          <h4 className="font-semibold text-white mb-2">🖼️ Event Image</h4>
                          <img 
                            src={event.image_url} 
                            alt={event.title}
                            className="w-full h-48 object-cover rounded-lg border border-muted/20"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              {event.status === 'pending' && (
                <Card className="ultra-dark-card">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button 
                        onClick={handleApprove}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white text-lg py-6"
                        size="lg"
                      >
                        ✅ Approve Event
                      </Button>
                      <Button 
                        onClick={handleReject} 
                        variant="destructive"
                        className="flex-1 text-lg py-6"
                        size="lg"
                      >
                        ❌ Reject Event
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-4 text-center">
                      Approving this event will make it live on the events page with its own shareable URL for ticket sales.
                    </p>
                  </CardContent>
                </Card>
              )}

              {event.status === 'approved' && (
                <Card className="ultra-dark-card border-green-500/50">
                  <CardContent className="p-6 text-center">
                    <h3 className="text-xl font-bold text-green-400 mb-2">✅ Event Approved!</h3>
                    <p className="text-muted-foreground mb-4">
                      This event is now live and available for ticket sales.
                    </p>
                    <Button asChild variant="outline">
                      <a href={`/events/${event.id}`} target="_blank" rel="noopener noreferrer">
                        View Live Event Page
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              )}

              {event.status === 'rejected' && (
                <Card className="ultra-dark-card border-red-500/50">
                  <CardContent className="p-6 text-center">
                    <h3 className="text-xl font-bold text-red-400 mb-2">❌ Event Rejected</h3>
                    <p className="text-muted-foreground">This event submission has been rejected.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import type { Database } from '@/types/database.types';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CalendarIcon, ClockIcon, MapPinIcon, DollarSignIcon, UserIcon, ShareIcon, TicketIcon, EditIcon, TrashIcon, CreditCardIcon, ImageIcon } from 'lucide-react';
import SocialShareButtons from '@/components/events/social-share-buttons';
import Image from 'next/image';

type Event = Database['public']['Tables']['events']['Row'];

// Default placeholder image URL (same as in EventCard)
const DEFAULT_EVENT_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='400' viewBox='0 0 800 400'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23E946E7;stop-opacity:0.8' /%3E%3Cstop offset='50%25' style='stop-color:%234F7CFF;stop-opacity:0.6' /%3E%3Cstop offset='100%25' style='stop-color:%23FFD700;stop-opacity:0.4' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='800' height='400' fill='%23020204'/%3E%3Crect width='800' height='400' fill='url(%23grad)'/%3E%3Ctext x='400' y='180' text-anchor='middle' fill='white' font-size='24' font-family='Arial, sans-serif'%3EEvent Flyer%3C/text%3E%3Ctext x='400' y='210' text-anchor='middle' fill='white' font-size='16' font-family='Arial, sans-serif' opacity='0.8'%3EComing Soon%3C/text%3E%3Ccircle cx='400' cy='250' r='20' fill='none' stroke='white' stroke-width='2' opacity='0.6'/%3E%3Cpath d='M385 250 h30 M400 235 v30' stroke='white' stroke-width='2' opacity='0.6'/%3E%3C/svg%3E";

export default function EventPage() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Event>>({});
  const [purchasingTicket, setPurchasingTicket] = useState(false);
  const [hasTicket, setHasTicket] = useState(false);
  const supabaseClient = supabase();

  // Check if current user can edit/delete this event
  const canEditEvent = user && (isAdmin || event?.user_id === user.id);
  useEffect(() => {
    async function fetchEvent() {
      try {
        const { data, error } = await supabaseClient
          .from('events')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setEvent(data);        // Check if user has a ticket for this event
        if (user) {
          const { data: tickets, error: ticketError } = await supabaseClient
            .from('tickets')
            .select('id')
            .eq('event_id', id)
            .eq('user_id', user.id)
            .eq('status', 'valid')
            .limit(1);
          
          if (ticketError) {
            console.warn('Error checking tickets:', ticketError);
            setHasTicket(false);
          } else {
            setHasTicket(tickets && tickets.length > 0);
          }
        }
      } catch (err) {
        setError('Failed to load event');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchEvent();
  }, [id, supabaseClient, user]);

  const handleDeleteEvent = async () => {
    if (!event || !user) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${event.name}"? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session) {
        alert('❌ Authentication required');
        return;
      }

      const response = await fetch(`/api/events/${event.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete event');
      }

      alert('✅ Event deleted successfully!');
      window.location.href = '/events'; // Redirect to events list

    } catch (error: any) {
      console.error('Delete error:', error);
      alert(`❌ Error deleting event: ${error.message || 'Please try again.'}`);
    }
  };

  const handleEditEvent = async () => {
    if (!event || !user || !editData) return;

    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session) {
        alert('❌ Authentication required');
        return;
      }

      const response = await fetch(`/api/events/${event.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update event');
      }

      setEvent(result.event);
      setIsEditing(false);
      setEditData({});
      alert('✅ Event updated successfully!');

    } catch (error: any) {
      console.error('Edit error:', error);
      alert(`❌ Error updating event: ${error.message || 'Please try again.'}`);
    }
  };

  const startEditing = () => {
    if (!event) return;
    setEditData({
      name: event.name,
      description: event.description,
      date: event.date,
      time: event.time,
      venue: event.venue,
      ticket_price: event.ticket_price,
      image_url: event.image_url,
    });
    setIsEditing(true);
  };

  const handlePurchaseTicket = async () => {
    if (!event || !user) {
      alert('❌ Please log in to purchase tickets');
      return;
    }

    if (hasTicket) {
      alert('✅ You already have a ticket for this event! Check your dashboard.');
      return;
    }

    setPurchasingTicket(true);

    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session) {
        alert('❌ Authentication required');
        setPurchasingTicket(false);
        return;
      }

      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventId: event.id }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      if (result.url) {
        window.location.href = result.url;
      } else {
        throw new Error('No checkout URL received');
      }

    } catch (error: any) {
      console.error('Purchase error:', error);
      alert(`❌ Error: ${error.message || 'Please try again.'}`);
      setPurchasingTicket(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-primary/20 rounded w-3/4 max-w-md"></div>
            <div className="h-32 bg-muted/30 rounded"></div>
            <div className="h-64 bg-muted/30 rounded"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-black">
        <div className="container mx-auto px-4 py-16">
          <Card className="ultra-dark-card p-8 text-center max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-4 text-destructive">Error Loading Event</h1>
            <p className="text-muted-foreground">{error}</p>
          </Card>
        </div>
      </div>
    );
  }
  
  if (!event) {
    return (
      <div className="min-h-screen bg-black">
        <div className="container mx-auto px-4 py-16">
          <Card className="ultra-dark-card p-8 text-center max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
            <p className="text-muted-foreground">The event you're looking for doesn't exist or has been removed.</p>
          </Card>
        </div>
      </div>
    );
  }

  const eventUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/events/${event.id}`;
  const eventDate = new Date(event.date);
  const isUpcoming = eventDate > new Date();

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">          {/* Header */}
          <div className="mb-8">
            <h1 className="text-5xl font-black brand-text-gradient mb-4">{event.name}</h1>
            <div className="flex items-center gap-2 mb-4">
              {isUpcoming ? (
                <Badge className="bg-green-600 hover:bg-green-700">Upcoming Event</Badge>
              ) : (
                <Badge variant="secondary">Past Event</Badge>
              )}
              <Badge variant="outline">${event.ticket_price}</Badge>
            </div>
            
            {/* Admin/Seller Actions */}
            {canEditEvent && (
              <div className="flex items-center gap-2 mt-4">
                <Button
                  onClick={startEditing}
                  variant="outline"
                  size="sm"
                  className="bg-blue-600/20 border-blue-500 hover:bg-blue-600/30"
                >
                  <EditIcon className="w-4 h-4 mr-2" />
                  Edit Event
                </Button>
                <Button
                  onClick={handleDeleteEvent}
                  variant="outline"
                  size="sm"
                  className="bg-red-600/20 border-red-500 hover:bg-red-600/30 text-red-400"
                >
                  <TrashIcon className="w-4 h-4 mr-2" />
                  Delete Event
                </Button>
              </div>
            )}
          </div>          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Event Image */}
            <div className="lg:col-span-2">
              <div className="mb-6 relative">
                <div className="w-full h-96 relative bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg shadow-2xl border border-muted/20 overflow-hidden">
                  <Image
                    src={event.image_url && !imageError ? event.image_url : DEFAULT_EVENT_IMAGE}
                    alt={event.name}
                    fill
                    className="object-cover"
                    onError={() => setImageError(true)}
                    data-ai-hint="event concert"
                  />
                  {(!event.image_url || imageError) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/30 to-secondary/30">
                      <div className="text-center text-white/80">
                        <ImageIcon className="h-16 w-16 mx-auto mb-4" />
                        <p className="text-lg font-medium">Event Flyer</p>
                        <p className="text-sm opacity-75">Coming Soon</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <Card className="ultra-dark-card">
                <CardHeader>
                  <CardTitle className="text-white">About This Event</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{event.description}</p>
                </CardContent>
              </Card>
            </div>

            {/* Event Details & Purchase */}
            <div className="space-y-6">
              {/* Event Info */}
              <Card className="ultra-dark-card">
                <CardHeader>
                  <CardTitle className="text-white">Event Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-white">{event.date}</p>
                      <p className="text-sm text-muted-foreground">Date</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <ClockIcon className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-white">{event.time}</p>
                      <p className="text-sm text-muted-foreground">Time</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <MapPinIcon className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-white">{event.venue}</p>
                      <p className="text-sm text-muted-foreground">Venue</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <DollarSignIcon className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-white">${event.ticket_price}</p>
                      <p className="text-sm text-muted-foreground">Price per ticket</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <UserIcon className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-white">{event.organizer_email}</p>
                      <p className="text-sm text-muted-foreground">Organizer</p>
                    </div>
                  </div>
                </CardContent>
              </Card>              {/* Get Tickets */}
              <Card className="ultra-dark-card">
                <CardContent className="p-6">
                  {hasTicket ? (
                    <div className="text-center space-y-4">
                      <div className="text-green-400 text-lg font-semibold">
                        ✅ You have a ticket for this event!
                      </div>
                      <Button 
                        asChild
                        className="w-full text-lg py-6 bg-green-600 hover:bg-green-700"
                        size="lg"
                      >
                        <a href="/dashboard">View My Tickets</a>
                      </Button>
                    </div>                  ) : user ? (
                    <div className="space-y-4">                      {/* Marketplace Notice */}
                      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                        <p className="text-green-400 text-sm font-medium mb-1">🎉 Professional Marketplace Active!</p>
                        <p className="text-xs text-muted-foreground">
                          Secure payments with instant seller payouts powered by Stripe Connect.
                        </p>
                      </div>
                      
                      <Button 
                        onClick={handlePurchaseTicket}
                        className="w-full text-lg py-6 dark-button-glow"
                        size="lg"
                        disabled={purchasingTicket}
                      >
                        {purchasingTicket ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4zm16 0a8 8 0 01-8 8v-8h8z"></path>
                            </svg>
                            Purchasing Ticket...
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <TicketIcon className="mr-2 h-5 w-5" />
                            Purchase Ticket - ${event.ticket_price}
                          </span>
                        )}
                      </Button>
                      <p className="text-sm text-muted-foreground text-center">
                        Free admission to this event
                      </p>
                    </div>
                  ) : (
                    <div className="text-center space-y-4">
                      <p className="text-muted-foreground">
                        Please log in to get your free ticket
                      </p>
                      <Button 
                        asChild
                        className="w-full text-lg py-6"
                        size="lg"
                      >
                        <a href="/login">Login to Get Ticket</a>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Share Event */}
              <Card className="ultra-dark-card">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <ShareIcon className="mr-2 h-5 w-5" />
                    Share This Event
                  </CardTitle>
                </CardHeader>
                <CardContent>                  <SocialShareButtons 
                    title={event.name}
                    url={eventUrl}
                  />
                </CardContent>              </Card>
            </div>
          </div>

          {/* Edit Modal */}
          {isEditing && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <Card className="ultra-dark-card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <CardHeader>
                  <CardTitle className="text-white">Edit Event</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Event Name</label>
                    <input
                      type="text"
                      value={editData.name || ''}
                      onChange={(e) => setEditData({...editData, name: e.target.value})}
                      className="w-full p-3 rounded-lg bg-muted/20 border border-muted/30 text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Description</label>
                    <textarea
                      value={editData.description || ''}
                      onChange={(e) => setEditData({...editData, description: e.target.value})}
                      rows={4}
                      className="w-full p-3 rounded-lg bg-muted/20 border border-muted/30 text-white"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Date</label>
                      <input
                        type="date"
                        value={editData.date || ''}
                        onChange={(e) => setEditData({...editData, date: e.target.value})}
                        className="w-full p-3 rounded-lg bg-muted/20 border border-muted/30 text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Time</label>
                      <input
                        type="time"
                        value={editData.time || ''}
                        onChange={(e) => setEditData({...editData, time: e.target.value})}
                        className="w-full p-3 rounded-lg bg-muted/20 border border-muted/30 text-white"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Venue</label>
                    <input
                      type="text"
                      value={editData.venue || ''}
                      onChange={(e) => setEditData({...editData, venue: e.target.value})}
                      className="w-full p-3 rounded-lg bg-muted/20 border border-muted/30 text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Ticket Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editData.ticket_price || ''}
                      onChange={(e) => setEditData({...editData, ticket_price: parseFloat(e.target.value) || 0})}
                      className="w-full p-3 rounded-lg bg-muted/20 border border-muted/30 text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Image URL (optional)</label>
                    <input
                      type="url"
                      value={editData.image_url || ''}
                      onChange={(e) => setEditData({...editData, image_url: e.target.value})}
                      className="w-full p-3 rounded-lg bg-muted/20 border border-muted/30 text-white"
                    />
                  </div>
                  
                  <div className="flex gap-4 pt-4">
                    <Button
                      onClick={handleEditEvent}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      Save Changes
                    </Button>
                    <Button
                      onClick={() => {
                        setIsEditing(false);
                        setEditData({});
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

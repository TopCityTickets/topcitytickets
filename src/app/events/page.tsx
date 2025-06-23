"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

import type { Database } from '@/types/database.types';
type Event = Database['public']['Tables']['events']['Row'];

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data, error } = await supabase()
          .from('events')
          .select('*')
          .eq('is_approved', true)
          .order('date', { ascending: true });
        
        if (error) {
          console.error('Error fetching events:', error);
        } else if (Array.isArray(data)) {
          setEvents(data);
        }
      } catch (error) {
        console.error('Fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);
  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-primary/20 rounded w-1/4"></div>
            <div className="h-32 bg-muted/30 rounded"></div>
            <div className="h-32 bg-muted/30 rounded"></div>
            <div className="h-32 bg-muted/30 rounded"></div>
          </div>
        </div>
      </div>
    );
  }
  if (events.length === 0) {
    return (
      <div className="min-h-screen bg-black">
        <div className="container mx-auto px-4 py-16">
          <Card className="ultra-dark-card p-8 text-center max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-4 brand-text-gradient">No Events Currently Available</h1>
            <p className="text-muted-foreground mb-6">
              Please check back regularly for upcoming events. Follow us on social media to stay informed about new ticket releases and events.
            </p>
            <div className="space-x-4">
              <Button asChild variant="outline">
                <a href="https://twitter.com/topcitytickets" target="_blank" rel="noopener noreferrer">
                  Follow on Twitter
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href="https://instagram.com/topcitytickets" target="_blank" rel="noopener noreferrer">
                  Follow on Instagram
                </a>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 brand-text-gradient">Upcoming Events</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (            <Card key={event.id} className="ultra-dark-card p-6">
              <h2 className="text-xl font-semibold mb-2 text-white">{event.name}</h2>
              <p className="text-muted-foreground mb-4">{event.description}</p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>📅 Date: {event.date}</p>
                <p>🕐 Time: {event.time}</p>
                <p>📍 Venue: {event.venue}</p>
                <p className="font-semibold text-accent">💰 Price: ${event.ticket_price}</p>
              </div>
              <div className="mt-4">
                <Link href={`/events/${event.id}`}>
                  <Button className="w-full dark-button-glow">View Details</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
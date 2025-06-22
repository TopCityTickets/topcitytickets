"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

import type { Database } from '@/types/database.types';
type Event = Database['public']['Tables']['event_submissions']['Row'];

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      const { data, error } = await supabase()
        .from('event_submissions')
        .select('*')
        .match({ status: 'approved' })
        .order('date', { ascending: true });      if (!error && Array.isArray(data)) {
        setEvents(data as unknown as Event[]);
      }
      setLoading(false);
    };

    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="p-8 text-center max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">No Events Currently Available</h1>
          <p className="text-gray-600 mb-6">
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
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Upcoming Events</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <Card key={event.id} className="p-6">
            <h2 className="text-xl font-semibold mb-2">{event.name}</h2>
            <p className="text-gray-600 mb-4">{event.description}</p>
            <div className="space-y-2">
              <p>Date: {event.date}</p>
              <p>Time: {event.time}</p>
              <p>Venue: {event.venue}</p>
              <p className="font-semibold">Price: ${event.ticket_price}</p>
            </div>
            <div className="mt-4">
              <Link href={`/events/${event.id}`}>
                <Button className="w-full">View Details</Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import type { Database } from '@/types/database.types';

type Event = Database['public']['Tables']['events']['Row'];

export default function HomePage() {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      const supabaseClient = supabase();
      const { data } = await supabaseClient
        .from('events')
        .select('*')
        .eq('is_approved', true);
      if (data) setEvents(data);
    };
    fetchEvents();
  }, []);

  return (
    <div className="container py-10 space-y-8">
      <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
        <div className="flex max-w-[980px] flex-col items-start gap-4">
          <h1 className="text-3xl font-bold leading-tight tracking-tighter md:text-6xl lg:leading-[1.1]">
            Find Your Perfect Event
          </h1>
          <p className="text-lg text-muted-foreground sm:text-xl">
            Discover and book tickets for the most exciting events in your city.
          </p>
        </div>
      </section>
      
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <div key={event.id} 
            className="group relative overflow-hidden rounded-lg border p-6 hover:border-primary/50 transition-colors glass-card">
            <h2 className="text-2xl font-semibold">{event.name}</h2>
            <p className="mt-2 text-muted-foreground">{event.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

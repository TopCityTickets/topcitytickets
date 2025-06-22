"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import type { Database } from '@/types/database.types';
import { useAuth } from '@/hooks/useAuth';

type Event = Database['public']['Tables']['events']['Row'];

export default function EventPage() {
  const { id } = useParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useAuth(); // Just call for side effects if needed
  const supabaseClient = supabase();

  useEffect(() => {
    async function fetchEvent() {
      try {
        const { data, error } = await supabaseClient
          .from('events')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setEvent(data);
      } catch (err) {
        setError('Failed to load event');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchEvent();
  }, [id, supabaseClient]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!event) return <div>Event not found</div>;

  return (
    <div>
      <h1>{event.name}</h1>
      <p>{event.description}</p>
      {/* Render other event details */}
    </div>
  );
}

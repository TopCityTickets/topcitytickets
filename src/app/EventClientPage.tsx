"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import type { Database } from '@/types/database.types';

type Event = Database['public']['Tables']['events']['Row'];

export default function EventClientPage() {
  const { id } = useParams();
  const [event, setEvent] = useState<Event | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      const supabaseClient = supabase();
      const { data, error } = await supabaseClient
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error:', error);
        return;
      }

      setEvent(data);
    };

    fetchEvent();
  }, [id]);

  if (!event) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>{event.name}</h1>
      <p>{event.description}</p>
      {/* Render other event details */}
    </div>
  );
}
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
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-4xl font-bold mb-4">{event.name}</h1>
          <p className="text-lg text-gray-600 mb-6">{event.description}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Event Details</h3>
              <div className="space-y-2">
                <p><span className="font-medium">Date:</span> {event.date}</p>
                <p><span className="font-medium">Time:</span> {event.time}</p>
                <p><span className="font-medium">Venue:</span> {event.venue}</p>
                <p><span className="font-medium">Price:</span> ${event.ticket_price}</p>
                <p><span className="font-medium">Organizer:</span> {event.organizer_email}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {event.image_url && (
              <div>
                <img 
                  src={event.image_url} 
                  alt={event.name}
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>
            )}
            
            <div>
              <button className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                Purchase Tickets - ${event.ticket_price}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

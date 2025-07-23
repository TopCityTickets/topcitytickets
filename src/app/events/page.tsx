import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function EventsPage() {
  const supabase = await createClient();
  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'active')
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching events:', error);
    return <p className="text-red-500">Failed to load events.</p>;
  }

  return (
    <div className="min-h-screen p-4 bg-slate-900">
      <h1 className="text-3xl font-bold text-white mb-6">Upcoming Events</h1>
      {events && events.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col"
            >
              <div className="p-4 flex-1">
                <h2 className="text-xl font-semibold mb-2">{event.title}</h2>
                <p className="text-gray-600 text-sm mb-4">
                  {new Date(event.date).toLocaleDateString()} @ {event.time}
                </p>
                <p className="text-gray-700 text-sm line-clamp-3">{event.description}</p>
              </div>
              <div className="p-4 bg-slate-100 text-right">
                <Link
                  href={`/events/${event.id}`}
                  className="text-primary font-semibold hover:underline"
                >
                  View Details →
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-white">No active events at the moment.</p>
      )}
    </div>
  );
}

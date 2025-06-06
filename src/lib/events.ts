import type { Event } from '@/types';
import { createClient } from './supabase/server';
import type { Tables } from '@/types/supabase';

// Helper to convert Supabase event row to our Event type
function supabaseEventToAppEvent(eventRow: Tables<'events'>): Event {
  return {
    id: eventRow.id,
    name: eventRow.name,
    date: eventRow.date,
    time: eventRow.time,
    venue: eventRow.venue,
    description: eventRow.description,
    ticketPrice: eventRow.ticket_price,
    imageUrl: eventRow.image_url || undefined,
    organizerEmail: eventRow.organizer_email,
    slug: eventRow.slug,
  };
}

const hardcodedEvent: Event = {
  id: '1',
  name: 'Top City Music Festival',
  date: '2025-07-15',
  time: '18:00',
  venue: 'Downtown Amphitheater',
  description:
    'Join us for an unforgettable night of music, food, and fun in the heart of the city! Featuring top artists and local talent.',
  ticketPrice: 49.99,
  imageUrl: '/sample-event.jpg',
  organizerEmail: 'topcitytickets@gmail.com',
  slug: 'top-city-music-festival',
};

export const getEventBySlug = async (slug: string): Promise<Event | undefined> => {
  // Try Supabase first
  try {
    const { getEventBySlug: getFromDb } = await import('./events-supabase');
    const dbEvent = await getFromDb(slug);
    if (dbEvent) return dbEvent;
  } catch {}
  // Fallback to hardcoded event
  if (slug === hardcodedEvent.slug) return hardcodedEvent;
  return undefined;
};

export const getAllEvents = async (): Promise<Event[]> => {
  // Try Supabase first
  try {
    const { getAllEvents: getFromDb } = await import('./events-supabase');
    const dbEvents = await getFromDb();
    if (dbEvents && dbEvents.length > 0) return dbEvents;
  } catch {}
  // Fallback to hardcoded event
  return [hardcodedEvent];
};

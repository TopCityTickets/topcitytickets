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

export const getEventBySlug = async (slug: string): Promise<Event | undefined> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .eq('is_approved', true)
    .maybeSingle();

  if (error) {
    console.error('Error fetching event by slug:', error);
    return undefined;
  }
  if (!data) {
    return undefined;
  }
  return supabaseEventToAppEvent(data);
};

export const getAllEvents = async (): Promise<Event[]> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('is_approved', true)
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching all events:', error);
    return [];
  }
  return data.map(supabaseEventToAppEvent);
};

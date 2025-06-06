import type { Event } from '@/types';

// Supabase logic removed. Use mock data or empty arrays for static export compatibility.
const mockEvents: Event[] = [];

export const getEventBySlug = async (slug: string): Promise<Event | undefined> => {
  // Return a mock event or undefined
  return mockEvents.find(event => event.slug === slug);
};

export const getAllEvents = async (): Promise<Event[]> => {
  // Return mock events
  return mockEvents;
};

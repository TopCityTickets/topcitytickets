import type { Event } from '@/types';

// Hardcoded sample event for demo/dev
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
  if (slug === hardcodedEvent.slug) return hardcodedEvent;
  return undefined;
};

export const getAllEvents = async (): Promise<Event[]> => {
  return [hardcodedEvent];
};

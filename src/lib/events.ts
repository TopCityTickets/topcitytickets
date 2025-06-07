import type { Event } from '@/types';

// Hardcoded sample events for demo/dev
const sampleEvents: Event[] = [
  {
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
  },
  {
    id: '2',
    name: 'Summer Art Exhibition',
    date: '2025-06-20',
    time: '10:00',
    venue: 'City Art Gallery',
    description:
      'Experience the vibrant art scene with works from both established and emerging artists. Special workshops and guided tours available.',
    ticketPrice: 15.0,
    imageUrl: '/sample-event.jpg',
    organizerEmail: 'topcitytickets@gmail.com',
    slug: 'summer-art-exhibition',
  },
  {
    id: '3',
    name: 'Tech Conference 2025',
    date: '2025-08-05',
    time: '09:00',
    venue: 'Convention Center',
    description:
      'Leading innovators and tech experts share insights on AI, blockchain, and the future of technology. Networking opportunities included.',
    ticketPrice: 299.99,
    imageUrl: '/sample-event.jpg',
    organizerEmail: 'topcitytickets@gmail.com',
    slug: 'tech-conference-2025',
  },
];

export const getEventBySlug = async (slug: string): Promise<Event | undefined> => {
  return sampleEvents.find(event => event.slug === slug);
};

export const getAllEvents = async (): Promise<Event[]> => {
  return sampleEvents;
};

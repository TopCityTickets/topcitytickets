import type { Event } from '@/types';

export const mockEvents: Event[] = [
  {
    id: '1',
    name: 'Summer Music Fest 2024',
    date: '2024-07-20',
    time: '14:00',
    venue: 'Central Park Bandshell',
    description: 'An amazing lineup of local and international artists. Enjoy a full day of music, food, and fun under the sun. Featuring rock, pop, indie, and electronic music across three stages.',
    ticketPrice: 75.00,
    imageUrl: 'https://placehold.co/600x400.png?text=Music+Fest',
    organizerEmail: 'events@musicfest.com',
    slug: 'summer-music-fest-2024'
  },
  {
    id: '2',
    name: 'Tech Innovators Conference',
    date: '2024-08-15',
    time: '09:00',
    venue: 'Downtown Convention Center',
    description: 'Join industry leaders, innovators, and thinkers for a two-day conference on the future of technology. Keynotes, workshops, and networking opportunities.',
    ticketPrice: 299.00,
    imageUrl: 'https://placehold.co/600x400.png?text=Tech+Conference',
    organizerEmail: 'info@techconf.org',
    slug: 'tech-innovators-conference'
  },
  {
    id: '3',
    name: 'Artisan Food Market',
    date: '2024-07-27',
    time: '10:00',
    venue: 'City Square Pavilion',
    description: 'Discover unique flavors from local artisans. Fresh produce, baked goods, gourmet cheeses, and much more. A perfect weekend outing for food lovers.',
    ticketPrice: 0.00, // Free event
    imageUrl: 'https://placehold.co/600x400.png?text=Food+Market',
    organizerEmail: 'market@cityfood.com',
    slug: 'artisan-food-market'
  },
  {
    id: '4',
    name: 'Indie Film Festival',
    date: '2024-09-05',
    time: '18:00',
    venue: 'The Grand Cinema',
    description: 'A week-long celebration of independent cinema. Showcasing short films, documentaries, and feature films from emerging filmmakers around the globe.',
    ticketPrice: 15.00, // Per screening or pass
    imageUrl: 'https://placehold.co/600x400.png?text=Film+Festival',
    organizerEmail: 'submissions@indiefilmfest.com',
    slug: 'indie-film-festival'
  },
];

export const getEventById = async (id: string): Promise<Event | undefined> => {
  // In a real app, this would fetch from a database
  return mockEvents.find(event => event.id === id || event.slug === id);
};

export const getAllEvents = async (): Promise<Event[]> => {
  // In a real app, this would fetch from a database
  return mockEvents;
};

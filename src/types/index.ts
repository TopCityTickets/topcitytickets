export type Event = {
  id: string;
  name: string;
  date: string; // Should be ISO string date
  time: string; // e.g., "HH:MM"
  venue: string;
  description: string;
  ticketPrice: number;
  imageUrl?: string;
  organizerEmail: string; // For internal use/contact
  slug: string; // for URL
};

// Add more types as needed

export * from './events';
export * from './auth';
export type { Database } from './database.types';

// Legacy type definitions (deprecated - use Database types instead)
export type Event = {
  id: string;
  name: string;
  date: string; // Should be ISO string date
  time: string; // e.g., "HH:MM"
  venue: string;
  description: string;
  ticket_price: number;
  image_url?: string;
  organizer_email: string; // For internal use/contact
  slug: string; // for URL
  user_id: string;
  is_approved: boolean;
  created_at: string;
};

import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';
import { EventStatus } from '@/types/database.types';

// Type utility for safely typing Supabase query results
export type TypedSupabaseClient = SupabaseClient<Database>;

// Define the expected shapes of database rows for direct casting
export type EventSubmission = {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  ticket_price: number;
  image_url: string | null;
  slug: string;
  user_id: string;
  organizer_email: string;
  status: EventStatus;
  admin_feedback: string | null;
  created_at: string;
};

// User data with role
export type UserData = {
  id: string;
  email: string;
  role: 'user' | 'seller' | 'admin';
  created_at: string;
};

// Utility function for safely casting Supabase data
export function safeCast<T>(data: any, defaultValue: T): T {
  if (!data) return defaultValue;
  return data as T;
}
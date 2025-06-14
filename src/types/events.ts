import type { Database } from './database.types';

export type Event = Database['public']['Tables']['events']['Row'];
export type EventSubmission = Database['public']['Tables']['event_submissions']['Row'];
export type EventInsert = Database['public']['Tables']['events']['Insert'];
export type EventSubmissionInsert = Database['public']['Tables']['event_submissions']['Insert'];

export type EventStatus = 'pending' | 'approved' | 'rejected';

export interface EventFormState {
  message?: string;
  errors?: {
    [key: string]: string[];
  };
}

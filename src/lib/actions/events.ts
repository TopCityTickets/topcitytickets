'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Database } from '@/types/supabase';

export type SubmitEventState = {
  message?: string | null;
  errors?: {
    name?: string[];
    date?: string[];
    time?: string[];
    venue?: string[];
    description?: string[];
    ticketPrice?: string[];
    organizerEmail?: string[];
    imageUrl?: string[];
    general?: string[];
  };
  success?: boolean;
};


export async function submitEvent(
  prevState: SubmitEventState,
  formData: FormData
): Promise<SubmitEventState> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      message: 'You must be logged in to submit an event.',
      success: false,
      errors: { general: ['Authentication required.'] }
    };
  }

  const rawFormData = {
    name: formData.get('name') as string,
    date: formData.get('date') as string,
    time: formData.get('time') as string,
    venue: formData.get('venue') as string,
    description: formData.get('description') as string,
    ticketPrice: parseFloat(formData.get('ticketPrice') as string),
    organizerEmail: formData.get('organizerEmail') as string,
    imageUrl: formData.get('imageUrl') as string | null,
  };

  // Basic validation (can be expanded with Zod)
  const errors: SubmitEventState['errors'] = {};
  if (!rawFormData.name) errors.name = ['Event name is required.'];
  if (!rawFormData.date) errors.date = ['Event date is required.'];
  if (!rawFormData.time) errors.time = ['Event time is required.'];
  if (!rawFormData.venue) errors.venue = ['Event venue is required.'];
  if (!rawFormData.description) errors.description = ['Event description is required.'];
  if (isNaN(rawFormData.ticketPrice) || rawFormData.ticketPrice < 0) errors.ticketPrice = ['Valid ticket price is required.'];
  if (!rawFormData.organizerEmail || !/\S+@\S+\.\S+/.test(rawFormData.organizerEmail)) errors.organizerEmail = ['Valid organizer email is required.'];
  
  if (Object.keys(errors).length > 0) {
    return { message: 'Invalid form data.', errors, success: false };
  }

  // For this assignment, we're not actually saving to a live "approved events" table.
  // We simulate submission, e.g., by logging or inserting into a "submissions" table if set up.
  // Example: inserting into an 'event_submissions' table
  
  type EventSubmissionInsert = Database['public']['Tables']['event_submissions']['Insert'];

  const submissionData: EventSubmissionInsert = {
    ...rawFormData,
    user_id: user.id,
    status: 'pending', // default status
  };
  
  // console.log('Event Submission Data:', submissionData);
  // Instead of direct insert to a live table, let's assume a submissions table
  const { error: submissionError } = await supabase
    .from('event_submissions') // Assuming you have this table for pending events
    .insert(submissionData);

  if (submissionError) {
    console.error('Supabase submission error:', submissionError);
    return { 
        message: `Failed to submit event: ${submissionError.message}`,
        success: false,
        errors: { general: [submissionError.message] }
    };
  }


  // Revalidate path if you have a page that shows submitted events by user
  // revalidatePath('/dashboard/my-submissions'); 

  return { message: 'Event submitted successfully! It will be reviewed by our team.', success: true };
}

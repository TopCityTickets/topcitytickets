
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Database, TablesInsert } from '@/types/supabase'; // Updated import

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

  // Check if user is a seller
  const userRole = user.user_metadata?.role;
  if (userRole !== 'seller') {
    return {
      message: 'You must be an approved seller to submit events.',
      success: false,
      errors: { general: ['Seller role required.'] }
    };
  }

  const rawFormData = {
    name: formData.get('name') as string,
    date: formData.get('date') as string,
    time: formData.get('time') as string,
    venue: formData.get('venue') as string,
    description: formData.get('description') as string,
    ticketPrice: parseFloat(formData.get('ticketPrice') as string),
    organizerEmail: formData.get('organizerEmail') as string, // Consider populating from user.email if appropriate
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
  
  const submissionData: TablesInsert<'event_submissions'> = {
    name: rawFormData.name,
    date: rawFormData.date,
    time: rawFormData.time,
    venue: rawFormData.venue,
    description: rawFormData.description,
    ticket_price: rawFormData.ticketPrice,
    image_url: rawFormData.imageUrl,
    organizer_email: rawFormData.organizerEmail, // This could default to user's email
    user_id: user.id,
    status: 'pending',
  };
  
  const { error: submissionError } = await supabase
    .from('event_submissions')
    .insert(submissionData);

  if (submissionError) {
    console.error('Supabase submission error:', submissionError);
    return { 
        message: `Failed to submit event: ${submissionError.message}`,
        success: false,
        errors: { general: [submissionError.message] }
    };
  }

  revalidatePath('/submit-event'); // Revalidate the submission page itself
  // Optionally, revalidate a page where users can see their submissions, e.g., /dashboard/my-submissions

  return { message: 'Event submitted successfully for review! It will be reviewed by our team.', success: true };
}

'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

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

export async function submitEvent(prevState: SubmitEventState, formData: FormData): Promise<SubmitEventState> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { 
      success: false,
      message: 'Not authenticated',
      errors: { general: ['User not authenticated'] }
    };
  }
  const eventData = {
    name: formData.get('name'),
    description: formData.get('description'),
    date: formData.get('date'),
    time: formData.get('time'),
    venue: formData.get('venue'),
    ticket_price: Number(formData.get('ticketPrice')),
    organizer_email: formData.get('organizerEmail'),
    image_url: formData.get('imageUrl') || null,
    user_id: user.id,
    status: 'pending' as const,
  };

  const { error } = await supabase
    .from('event_submissions')
    .insert(eventData);

  if (error) return { 
    success: false, 
    message: error.message,
    errors: { general: [error.message] }
  };

  revalidatePath('/events');
  return { success: true, message: 'Event submitted successfully!' };
}

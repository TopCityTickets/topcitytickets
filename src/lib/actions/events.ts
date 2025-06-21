'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Add this type export:
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
    ticket_price: Number(formData.get('ticket_price')),
    organizer_email: formData.get('organizer_email'),
    user_id: user.id,
    status: 'pending',
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
  return { success: true };
}

// npm run build

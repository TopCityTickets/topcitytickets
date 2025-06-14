import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import type { Database } from '@/types/database.types';

type EventSubmission = Database['public']['Tables']['event_submissions']['Insert'];

export function useEventForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabaseClient = supabase();

  const submitEvent = async (formData: EventSubmission) => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabaseClient
        .from('event_submissions')
        .insert(formData);

      if (error) throw error;
      router.push('/seller/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit event');
    } finally {
      setLoading(false);
    }
  };

  return { submitEvent, loading, error };
}

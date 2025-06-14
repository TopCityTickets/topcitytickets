import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database.types';

let supabaseInstance: ReturnType<typeof createClientComponentClient<Database>>;

export const supabase = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClientComponentClient<Database>({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      options: {
        global: {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      },
    });
  }
  return supabaseInstance;
};

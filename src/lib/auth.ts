import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database.types';

export const createClient = () => {
  return createServerActionClient<Database>({ cookies });
};

// ...existing auth functions...

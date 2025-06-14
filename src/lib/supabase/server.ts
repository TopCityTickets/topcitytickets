import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database.types';

export function createClient() {
  return createServerComponentClient<Database>({
    cookies,
  });
}

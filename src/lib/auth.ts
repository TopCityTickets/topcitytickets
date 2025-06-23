import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database.types';

export { createClient };

// Re-export for backward compatibility
export const createServerActionClient = createClient;

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database.types'

export const supabase = () => createClientComponentClient<Database>({
  options: {
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'x-connection-type': 'pooled'
      }
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true
    }
  }
})

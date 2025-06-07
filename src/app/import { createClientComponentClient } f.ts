import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database.types'

let supabaseInstance: ReturnType<typeof createClientComponentClient<Database>> | null = null

export const supabase = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClientComponentClient<Database>()
  }
  return supabaseInstance
}

export const ADMIN_EMAIL = 'topcitytickets@gmail.com'
export const ADMIN_ID = '5d2f1227-7db9-4e4f-a033-f29156e6cd3a'

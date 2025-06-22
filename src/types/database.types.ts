export type EventStatus = 'pending' | 'approved' | 'rejected';

export type Database = {
  public: {
    Tables: {
      events: {
        Row: {
          id: string
          name: string
          description: string
          date: string
          time: string
          venue: string
          ticket_price: number
          image_url: string | null
          slug: string
          user_id: string
          organizer_email: string
          is_approved: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          date: string
          time: string
          venue: string
          ticket_price: number
          image_url?: string | null
          slug?: string
          user_id: string
          organizer_email: string
          is_approved?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          date?: string
          time?: string
          venue?: string
          ticket_price?: number
          image_url?: string | null
          slug?: string
          user_id?: string
          organizer_email?: string
          is_approved?: boolean
          created_at?: string
        }
      }
      event_submissions: {
        Row: {
          id: string
          name: string
          description: string
          date: string
          time: string
          venue: string
          ticket_price: number
          image_url: string | null
          slug: string
          user_id: string
          organizer_email: string
          status: EventStatus
          admin_feedback: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          date: string
          time: string
          venue: string
          ticket_price: number
          image_url?: string | null
          slug?: string
          user_id: string
          organizer_email: string
          status?: EventStatus
          admin_feedback?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          date?: string
          time?: string
          venue?: string
          ticket_price?: number
          image_url?: string | null
          slug?: string
          user_id?: string
          organizer_email?: string
          status?: EventStatus
          admin_feedback?: string | null
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          role: 'user' | 'seller' | 'admin'
          created_at: string
        }
        Insert: {
          id: string
          email: string
          role?: 'user' | 'seller' | 'admin'
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'user' | 'seller' | 'admin'
          created_at?: string
        }
      }
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type EventSubmission = Tables<'event_submissions'>;
export type User = Tables<'users'>;

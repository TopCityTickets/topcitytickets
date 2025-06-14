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
          status: 'pending' | 'approved' | 'rejected'
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
          status?: 'pending' | 'approved' | 'rejected'
          admin_feedback?: string | null
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
          status?: 'pending' | 'approved' | 'rejected'
          admin_feedback?: string | null
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

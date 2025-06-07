export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          role: 'user' | 'seller' | 'admin'
          created_at: string
        }
      }
      events: {
        Row: {
          id: string
          name: string
          description: string
          date: string
          time: string
          venue: string
          ticket_price: number
          image_url?: string
          slug: string
          user_id: string
          organizer_email: string
          is_approved: boolean
          created_at: string
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
          image_url?: string
          slug: string
          user_id: string
          organizer_email: string
          status: 'pending' | 'approved' | 'rejected'
          admin_feedback?: string
          created_at: string
        }
      }
    }
  }
}

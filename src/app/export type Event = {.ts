export type Event = {
  id: string
  name: string
  date: string
  time: string
  venue: string
  description: string
  ticket_price: number
  image_url?: string
  organizer_email: string
  slug: string
  is_approved: boolean
  user_id?: string
  created_at: string
}

export type UserRole = 'user' | 'seller' | 'admin'

export interface Database {
  public: {
    Tables: {
      events: {
        Row: Event
      }
      users: {
        Row: {
          id: string
          email: string
          role: UserRole
          created_at: string
        }
      }
    }
  }
}

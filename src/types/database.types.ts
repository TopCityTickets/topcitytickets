export type EventStatus = 'pending' | 'approved' | 'rejected';

export type Database = {
  public: {
    Tables: {
      events: {
        Row: {
          id: string
          title: string
          description: string
          date: string
          time: string
          venue: string
          ticket_price: number
          image_url: string | null
          slug: string
          seller_id: string
          organizer_email: string
          is_active: boolean
          tickets_sold: number
          max_tickets: number | null
          submission_id: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          date: string
          time: string
          venue: string
          ticket_price: number
          image_url?: string | null
          slug: string
          seller_id: string
          organizer_email: string
          is_active?: boolean
          tickets_sold?: number
          max_tickets?: number | null
          submission_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          date?: string
          time?: string
          venue?: string
          ticket_price?: number
          image_url?: string | null
          slug?: string
          seller_id?: string
          organizer_email?: string
          is_active?: boolean
          tickets_sold?: number
          max_tickets?: number | null
          submission_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      event_submissions: {
        Row: {
          id: string
          title: string
          description: string
          date: string
          time: string
          venue: string
          ticket_price: number
          image_url: string | null
          seller_id: string
          organizer_email: string
          status: EventStatus
          admin_feedback: string | null
          submitted_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          date: string
          time: string
          venue: string
          ticket_price: number
          image_url?: string | null
          seller_id: string
          organizer_email: string
          status?: EventStatus
          admin_feedback?: string | null
          submitted_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          date?: string
          time?: string
          venue?: string
          ticket_price?: number
          image_url?: string | null
          seller_id?: string
          organizer_email?: string
          status?: EventStatus
          admin_feedback?: string | null
          submitted_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          role: 'admin' | 'seller' | 'customer'
          seller_status: 'none' | 'pending' | 'approved' | 'denied'
          seller_business_name: string | null
          seller_business_type: string | null
          seller_description: string | null
          seller_contact_email: string | null
          seller_contact_phone: string | null
          seller_applied_at: string | null
          seller_approved_at: string | null
          seller_denied_at: string | null
          can_reapply_at: string | null
          admin_notes: string | null
          stripe_customer_id: string | null
          stripe_connect_account_id: string | null
          stripe_onboarding_completed: boolean
          first_name: string | null
          last_name: string | null
          avatar_url: string | null
          profile_picture_url: string | null
          bio: string | null
          phone: string | null
          website_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role?: 'admin' | 'seller' | 'customer'
          seller_status?: 'none' | 'pending' | 'approved' | 'denied'
          seller_business_name?: string | null
          seller_business_type?: string | null
          seller_description?: string | null
          seller_contact_email?: string | null
          seller_contact_phone?: string | null
          seller_applied_at?: string | null
          seller_approved_at?: string | null
          seller_denied_at?: string | null
          can_reapply_at?: string | null
          admin_notes?: string | null
          stripe_customer_id?: string | null
          stripe_connect_account_id?: string | null
          stripe_onboarding_completed?: boolean
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          profile_picture_url?: string | null
          bio?: string | null
          phone?: string | null
          website_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'admin' | 'seller' | 'customer'
          seller_status?: 'none' | 'pending' | 'approved' | 'denied'
          seller_business_name?: string | null
          seller_business_type?: string | null
          seller_description?: string | null
          seller_contact_email?: string | null
          seller_contact_phone?: string | null
          seller_applied_at?: string | null
          seller_approved_at?: string | null
          seller_denied_at?: string | null
          can_reapply_at?: string | null
          admin_notes?: string | null
          stripe_customer_id?: string | null
          stripe_connect_account_id?: string | null
          stripe_onboarding_completed?: boolean
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          profile_picture_url?: string | null
          bio?: string | null
          phone?: string | null
          website_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      seller_applications: {
        Row: {
          id: string
          seller_id: string
          business_name: string
          business_type: string
          business_description: string | null
          contact_email: string
          contact_phone: string | null
          website_url: string | null
          is_active: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          seller_id: string
          business_name: string
          business_type: string
          business_description?: string | null
          contact_email: string
          contact_phone?: string | null
          website_url?: string | null
          is_active?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          seller_id?: string
          business_name?: string
          business_type?: string
          business_description?: string | null
          contact_email?: string
          contact_phone?: string | null
          website_url?: string | null
          is_active?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tickets: {
        Row: {
          id: string
          event_id: string
          user_id: string | null
          anonymous_purchase_id: string | null
          ticket_code: string
          purchase_amount: number
          quantity: number
          stripe_payment_intent_id: string | null
          stripe_charge_id: string | null
          status: 'valid' | 'used' | 'cancelled' | 'refunded'
          purchased_at: string
          used_at: string | null
          refunded_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id?: string | null
          anonymous_purchase_id?: string | null
          ticket_code?: string
          purchase_amount: number
          quantity?: number
          stripe_payment_intent_id?: string | null
          stripe_charge_id?: string | null
          status?: 'valid' | 'used' | 'cancelled' | 'refunded'
          purchased_at?: string
          used_at?: string | null
          refunded_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string | null
          anonymous_purchase_id?: string | null
          ticket_code?: string
          purchase_amount?: number
          quantity?: number
          stripe_payment_intent_id?: string | null
          stripe_charge_id?: string | null
          status?: 'valid' | 'used' | 'cancelled' | 'refunded'
          purchased_at?: string
          used_at?: string | null
          refunded_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      anonymous_purchases: {
        Row: {
          id: string
          buyer_email: string
          buyer_first_name: string | null
          buyer_last_name: string | null
          buyer_phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          buyer_email: string
          buyer_first_name?: string | null
          buyer_last_name?: string | null
          buyer_phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          buyer_email?: string
          buyer_first_name?: string | null
          buyer_last_name?: string | null
          buyer_phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      escrow_holds: {
        Row: {
          id: string
          event_id: string
          seller_id: string
          total_amount: number
          platform_fee: number
          stripe_fee: number
          seller_amount: number
          tickets_count: number
          status: 'pending' | 'released' | 'refunded' | 'failed'
          stripe_payment_intent_ids: string[]
          payout_date: string | null
          released_at: string | null
          refunded_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          seller_id: string
          total_amount: number
          platform_fee: number
          stripe_fee: number
          seller_amount: number
          tickets_count?: number
          status?: 'pending' | 'released' | 'refunded' | 'failed'
          stripe_payment_intent_ids?: string[]
          payout_date?: string | null
          released_at?: string | null
          refunded_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          seller_id?: string
          total_amount?: number
          platform_fee?: number
          stripe_fee?: number
          seller_amount?: number
          tickets_count?: number
          status?: 'pending' | 'released' | 'refunded' | 'failed'
          stripe_payment_intent_ids?: string[]
          payout_date?: string | null
          released_at?: string | null
          refunded_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type EventSubmission = Tables<'event_submissions'>;
export type User = Tables<'users'>;
export type SellerApplication = Tables<'seller_applications'>;

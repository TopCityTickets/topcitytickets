// Updated database types for the complete system redesign

export type UserRole = 'user' | 'seller' | 'admin';
export type SellerStatus = 'pending' | 'approved' | 'denied' | null;
export type EventStatus = 'pending' | 'approved' | 'rejected';
export type TicketStatus = 'valid' | 'used' | 'cancelled' | 'refunded';
export type EscrowStatus = 'holding' | 'released' | 'refunded';

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string | null
          role: UserRole
          first_name: string | null
          last_name: string | null
          is_anonymous: boolean
          seller_status: SellerStatus
          seller_applied_at: string | null
          seller_approved_at: string | null
          seller_denied_at: string | null
          can_reapply_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          role?: UserRole
          first_name?: string | null
          last_name?: string | null
          is_anonymous?: boolean
          seller_status?: SellerStatus
          seller_applied_at?: string | null
          seller_approved_at?: string | null
          seller_denied_at?: string | null
          can_reapply_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          role?: UserRole
          first_name?: string | null
          last_name?: string | null
          is_anonymous?: boolean
          seller_status?: SellerStatus
          seller_applied_at?: string | null
          seller_approved_at?: string | null
          seller_denied_at?: string | null
          can_reapply_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      anonymous_purchases: {
        Row: {
          id: string
          email: string
          first_name: string | null
          last_name: string | null
          phone: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          created_at?: string
        }
      }
      event_submissions: {
        Row: {
          id: string
          seller_id: string
          title: string
          description: string
          date: string
          time: string
          venue: string
          ticket_price: number
          image_url: string | null
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
          seller_id: string
          title: string
          description: string
          date: string
          time: string
          venue: string
          ticket_price?: number
          image_url?: string | null
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
          seller_id?: string
          title?: string
          description?: string
          date?: string
          time?: string
          venue?: string
          ticket_price?: number
          image_url?: string | null
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
      events: {
        Row: {
          id: string
          submission_id: string | null
          seller_id: string
          title: string
          description: string
          date: string
          time: string
          venue: string
          ticket_price: number
          image_url: string | null
          slug: string
          organizer_email: string
          is_active: boolean
          tickets_sold: number
          max_tickets: number | null
          created_at: string
          updated_at: string
          approved_at: string
          approved_by: string | null
        }
        Insert: {
          id?: string
          submission_id?: string | null
          seller_id: string
          title: string
          description: string
          date: string
          time: string
          venue: string
          ticket_price?: number
          image_url?: string | null
          slug: string
          organizer_email: string
          is_active?: boolean
          tickets_sold?: number
          max_tickets?: number | null
          created_at?: string
          updated_at?: string
          approved_at?: string
          approved_by?: string | null
        }
        Update: {
          id?: string
          submission_id?: string | null
          seller_id?: string
          title?: string
          description?: string
          date?: string
          time?: string
          venue?: string
          ticket_price?: number
          image_url?: string | null
          slug?: string
          organizer_email?: string
          is_active?: boolean
          tickets_sold?: number
          max_tickets?: number | null
          created_at?: string
          updated_at?: string
          approved_at?: string
          approved_by?: string | null
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
          status: TicketStatus
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
          status?: TicketStatus
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
          status?: TicketStatus
          purchased_at?: string
          used_at?: string | null
          refunded_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      escrow_holds: {
        Row: {
          id: string
          event_id: string
          total_amount: number
          platform_fee: number
          seller_amount: number
          status: EscrowStatus
          hold_until: string
          released_at: string | null
          stripe_account_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          total_amount?: number
          platform_fee?: number
          seller_amount?: number
          status?: EscrowStatus
          hold_until: string
          released_at?: string | null
          stripe_account_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          total_amount?: number
          platform_fee?: number
          seller_amount?: number
          status?: EscrowStatus
          hold_until?: string
          released_at?: string | null
          stripe_account_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      escrow_payments: {
        Row: {
          id: string
          escrow_hold_id: string
          ticket_id: string
          amount: number
          platform_fee: number
          seller_amount: number
          stripe_payment_intent_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          escrow_hold_id: string
          ticket_id: string
          amount: number
          platform_fee?: number
          seller_amount?: number
          stripe_payment_intent_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          escrow_hold_id?: string
          ticket_id?: string
          amount?: number
          platform_fee?: number
          seller_amount?: number
          stripe_payment_intent_id?: string | null
          created_at?: string
        }
      }
      seller_stripe_accounts: {
        Row: {
          id: string
          user_id: string
          stripe_account_id: string
          account_status: string
          details_submitted: boolean
          charges_enabled: boolean
          payouts_enabled: boolean
          requirements: any
          capabilities: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_account_id: string
          account_status?: string
          details_submitted?: boolean
          charges_enabled?: boolean
          payouts_enabled?: boolean
          requirements?: any
          capabilities?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_account_id?: string
          account_status?: string
          details_submitted?: boolean
          charges_enabled?: boolean
          payouts_enabled?: boolean
          requirements?: any
          capabilities?: any
          created_at?: string
          updated_at?: string
        }
      }
      customer_payment_methods: {
        Row: {
          id: string
          user_id: string | null
          anonymous_purchase_id: string | null
          stripe_customer_id: string
          stripe_payment_method_id: string
          payment_method_type: string
          last_four: string | null
          brand: string | null
          is_default: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          anonymous_purchase_id?: string | null
          stripe_customer_id: string
          stripe_payment_method_id: string
          payment_method_type?: string
          last_four?: string | null
          brand?: string | null
          is_default?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          anonymous_purchase_id?: string | null
          stripe_customer_id?: string
          stripe_payment_method_id?: string
          payment_method_type?: string
          last_four?: string | null
          brand?: string | null
          is_default?: boolean
          created_at?: string
        }
      }
    }
    Functions: {
      apply_for_seller: {
        Args: { user_id: string }
        Returns: any
      }
      review_seller_application: {
        Args: { user_id: string; approved: boolean; admin_id: string }
        Returns: any
      }
      approve_event_submission: {
        Args: { submission_id: string; admin_id: string }
        Returns: any
      }
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];

// Convenience types
export type User = Tables<'users'>;
export type AnonymousPurchase = Tables<'anonymous_purchases'>;
export type EventSubmission = Tables<'event_submissions'>;
export type Event = Tables<'events'>;
export type Ticket = Tables<'tickets'>;
export type EscrowHold = Tables<'escrow_holds'>;
export type EscrowPayment = Tables<'escrow_payments'>;
export type SellerStripeAccount = Tables<'seller_stripe_accounts'>;
export type CustomerPaymentMethod = Tables<'customer_payment_methods'>;

// Extended types with relationships
export type EventWithSeller = Event & {
  seller: User;
  escrow_hold?: EscrowHold;
};

export type TicketWithEvent = Ticket & {
  event: Event;
  user?: User;
  anonymous_purchase?: AnonymousPurchase;
};

export type EventSubmissionWithSeller = EventSubmission & {
  seller: User;
  reviewed_by_user?: User;
};

export type UserWithSellerInfo = User & {
  seller_stripe_account?: SellerStripeAccount;
  can_apply_for_seller: boolean;
  days_until_reapply?: number;
};

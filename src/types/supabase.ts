export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      // Example: If you have an 'events' table
      // events: {
      //   Row: {
      //     id: string
      //     created_at: string
      //     name: string
      //     date: string
      //     time: string
      //     venue: string
      //     description: string
      //     ticket_price: number
      //     image_url: string | null
      //     organizer_email: string
      //     slug: string
      //     user_id: string // who submitted it
      //     is_approved: boolean 
      //   }
      //   Insert: {
      //     id?: string
      //     created_at?: string
      //     name: string
      //     date: string
      //     time: string
      //     venue: string
      //     description: string
      //     ticket_price: number
      //     image_url?: string | null
      //     organizer_email: string
      //     slug: string
      //     user_id: string
      //     is_approved?: boolean
      //   }
      //   Update: {
      //     id?: string
      //     created_at?: string
      //     name?: string
      //     date?: string
      //     time?: string
      //     venue?: string
      //     description?: string
      //     ticket_price?: number
      //     image_url?: string | null
      //     organizer_email?: string
      //     slug?: string
      //     user_id?: string
      //     is_approved?: boolean
      //   }
      //   Relationships: [
      //     {
      //       foreignKeyName: "events_user_id_fkey"
      //       columns: ["user_id"]
      //       referencedRelation: "users"
      //       referencedColumns: ["id"]
      //     }
      //   ]
      // }
      // This is a placeholder.
      // Generate your C# types from Supabase and paste them here.
      // Example: `supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/supabase.ts`
      // For the purpose of this app, we will assume an 'events' table might exist
      // but will primarily use mock data for display, and submissions will be logged.
      // If you create an 'event_submissions' table for pending events, define it here.
      event_submissions: {
        Row: {
          id: string
          created_at: string
          name: string
          date: string
          time: string
          venue: string
          description: string
          ticket_price: number
          image_url: string | null
          organizer_email: string
          user_id: string
          status: "pending" | "approved" | "rejected" // Example status
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          date: string
          time: string
          venue: string
          description: string
          ticket_price: number
          image_url?: string | null
          organizer_email: string
          user_id: string
          status?: "pending" | "approved" | "rejected"
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          date?: string
          time?: string
          venue?: string
          description?: string
          ticket_price?: number
          image_url?: string | null
          organizer_email?: string
          user_id?: string
          status?: "pending" | "approved" | "rejected"
        }
        Relationships: [
          {
            foreignKeyName: "event_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never

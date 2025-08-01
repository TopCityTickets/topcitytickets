export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          role: string
          role_id: string
          setup_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          role?: string
          role_id?: string
          setup_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          role?: string
          role_id?: string
          setup_completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

export interface FormData {
  businessName: string;
  businessType: string;
  description?: string;
  contactEmail: string;
  contactPhone?: string;
  websiteUrl?: string;
}

export interface ApiResponse {
  success: boolean;
  message: string;
  error?: string;
}
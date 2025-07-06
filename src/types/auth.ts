import type { User } from '@supabase/supabase-js';

export type UserRole = 'customer' | 'seller' | 'admin';

export interface AuthUser extends User {
  role?: UserRole;
  first_name?: string;
  last_name?: string;
}

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAdmin: boolean;
  isSeller: boolean;
  isAuthenticated: boolean;
}

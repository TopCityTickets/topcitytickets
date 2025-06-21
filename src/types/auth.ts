import type { User } from '@supabase/supabase-js';

export type UserRole = 'user' | 'seller' | 'admin';

export interface AuthUser extends User {
  role?: UserRole;
}

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAdmin: boolean;
  isSeller: boolean;
  isAuthenticated: boolean;
}

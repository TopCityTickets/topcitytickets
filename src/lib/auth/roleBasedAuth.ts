// Enhanced auth service with role-based JWT tokens
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { UserRole } from '@/types/auth';

interface AuthUser extends User {
  user_role?: UserRole;
}

interface AuthResponse {
  user: AuthUser | null;
  role: UserRole;
  error?: string;
}

export class RoleBasedAuthService {
  private supabase = createClient();

  /**
   * Sign in user and get role-based JWT token
   */
  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { user: null, role: 'customer', error: error.message };
      }

      if (!data.user) {
        return { user: null, role: 'customer', error: 'No user returned' };
      }

      // Get user role from database
      const role = await this.getUserRole(data.user.id);
      
      // Update the session with role claim
      await this.updateSessionWithRole(role);

      return {
        user: { ...data.user, user_role: role },
        role,
      };
    } catch (error) {
      return {
        user: null,
        role: 'customer',
        error: error instanceof Error ? error.message : 'Sign in failed',
      };
    }
  }

  /**
   * Sign up user with default customer role
   */
  async signUp(
    email: string,
    password: string,
    metadata: {
      first_name: string;
      last_name: string;
      role?: UserRole;
    }
  ): Promise<AuthResponse> {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            ...metadata,
            role: metadata.role || 'customer',
          },
        },
      });

      if (error) {
        return { user: null, role: 'customer', error: error.message };
      }

      const role = metadata.role || 'customer';

      return {
        user: data.user ? { ...data.user, user_role: role } : null,
        role,
      };
    } catch (error) {
      return {
        user: null,
        role: 'customer',
        error: error instanceof Error ? error.message : 'Sign up failed',
      };
    }
  }

  /**
   * Get current user with role information
   */
  async getCurrentUser(): Promise<AuthResponse> {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser();

      if (error) {
        return { user: null, role: 'customer', error: error.message };
      }

      if (!user) {
        return { user: null, role: 'customer' };
      }

      // Get role from JWT claims first, then from database
      let role: UserRole = 'customer';
      
      // Try to get role from JWT claims
      const session = await this.supabase.auth.getSession();
      if (session.data.session?.access_token) {
        try {
          const payload = JSON.parse(
            atob(session.data.session.access_token.split('.')[1])
          );
          role = payload.user_role || 'customer';
        } catch {
          // If JWT parsing fails, get from database
          role = await this.getUserRole(user.id);
        }
      } else {
        role = await this.getUserRole(user.id);
      }

      return {
        user: { ...user, user_role: role },
        role,
      };
    } catch (error) {
      return {
        user: null,
        role: 'customer',
        error: error instanceof Error ? error.message : 'Failed to get user',
      };
    }
  }

  /**
   * Get user role from database
   */
  private async getUserRole(userId: string): Promise<UserRole> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (error || !data) {
        console.error('Error fetching user role:', error);
        return 'customer';
      }

      return data.role as UserRole;
    } catch (error) {
      console.error('Error fetching user role:', error);
      return 'customer';
    }
  }

  /**
   * Update session with role claim
   * This requires a server-side endpoint to refresh the token with role claims
   */
  private async updateSessionWithRole(role: UserRole): Promise<void> {
    try {
      // Call our API endpoint to refresh token with role claims
      const response = await fetch('/api/auth/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        console.error('Failed to update session with role');
      }
    } catch (error) {
      console.error('Error updating session with role:', error);
    }
  }

  /**
   * Check if user has specific role
   */
  hasRole(userRole: UserRole, requiredRole: UserRole | UserRole[]): boolean {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    return roles.includes(userRole);
  }

  /**
   * Check if user is admin
   */
  isAdmin(userRole: UserRole): boolean {
    return userRole === 'admin';
  }

  /**
   * Check if user is seller or admin
   */
  isSellerOrAdmin(userRole: UserRole): boolean {
    return ['seller', 'admin'].includes(userRole);
  }

  /**
   * Sign out user
   */
  async signOut(): Promise<{ error?: string }> {
    try {
      const { error } = await this.supabase.auth.signOut();
      return { error: error?.message };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Sign out failed',
      };
    }
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return this.supabase.auth.onAuthStateChange(callback);
  }
}

// Export singleton instance
export const authService = new RoleBasedAuthService();

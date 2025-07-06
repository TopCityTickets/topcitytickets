"use client";

import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types/auth';

interface RoleBasedAccessProps {
  children: ReactNode;
  allowedRoles: UserRole | UserRole[];
  fallback?: ReactNode;
  requireAuth?: boolean;
}

/**
 * Component that conditionally renders children based on user role
 * 
 * @example
 * <RoleBasedAccess allowedRoles="admin">
 *   <AdminPanel />
 * </RoleBasedAccess>
 * 
 * @example
 * <RoleBasedAccess allowedRoles={["seller", "admin"]} fallback={<div>Access denied</div>}>
 *   <SellerDashboard />
 * </RoleBasedAccess>
 */
export function RoleBasedAccess({
  children,
  allowedRoles,
  fallback = null,
  requireAuth = true,
}: RoleBasedAccessProps) {
  const { user, role, loading } = useAuth();

  // Show loading state
  if (loading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  // Check authentication requirement
  if (requireAuth && !user) {
    return fallback;
  }

  // Check role access
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  const hasAccess = roles.includes(role);

  if (!hasAccess) {
    return fallback;
  }

  return <>{children}</>;
}

interface AdminOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Convenience component for admin-only content
 */
export function AdminOnly({ children, fallback = null }: AdminOnlyProps) {
  return (
    <RoleBasedAccess allowedRoles="admin" fallback={fallback}>
      {children}
    </RoleBasedAccess>
  );
}

interface SellerOrAdminProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Convenience component for seller or admin content
 */
export function SellerOrAdmin({ children, fallback = null }: SellerOrAdminProps) {
  return (
    <RoleBasedAccess allowedRoles={["seller", "admin"]} fallback={fallback}>
      {children}
    </RoleBasedAccess>
  );
}

interface AuthenticatedOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Convenience component for authenticated users only
 */
export function AuthenticatedOnly({ children, fallback = null }: AuthenticatedOnlyProps) {
  return (
    <RoleBasedAccess 
      allowedRoles={["customer", "seller", "admin"]} 
      fallback={fallback}
    >
      {children}
    </RoleBasedAccess>
  );
}

/**
 * Hook to check if user has specific role
 */
export function useRoleCheck() {
  const { role } = useAuth();

  return {
    hasRole: (requiredRole: UserRole | UserRole[]) => {
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      return roles.includes(role);
    },
    isAdmin: role === 'admin',
    isSeller: role === 'seller',
    isCustomer: role === 'customer',
    isSellerOrAdmin: ['seller', 'admin'].includes(role),
  };
}

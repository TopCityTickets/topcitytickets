# Role-Based Access Control (RBAC) Implementation Guide

## Overview

Our ticketing platform now has a comprehensive RBAC system with three roles:
- **Customer**: Default role, can browse events and buy tickets
- **Seller**: Can create and manage events, view their sales
- **Admin**: Full platform access, can manage users and approve sellers

## Architecture

### 1. Database Level (Supabase)
- Custom database roles: `ticketing_customer`, `ticketing_seller`, `ticketing_admin`
- Row Level Security (RLS) policies on all tables
- Helper functions for role checking in SQL

### 2. Authentication Level
- JWT tokens with role claims
- Role-based session management
- Automatic token refresh with role information

### 3. Application Level
- Route protection middleware
- Role-based component rendering
- Type-safe role checking hooks

## Implementation

### Setting Up the Database

1. Apply the migration:
```sql
-- Run the migration in Supabase SQL editor
-- File: supabase/migrations/002_enhanced_rbac.sql
```

2. Configure environment variables:
```env
SUPABASE_JWT_SECRET=your-jwt-secret  # From Supabase project settings
```

### Using Role-Based Authentication

```typescript
import { authService } from '@/lib/auth/roleBasedAuth';

// Sign in with role-based JWT
const { user, role, error } = await authService.signIn(email, password);

// Check user role
const isAdmin = authService.isAdmin(role);
const canManageEvents = authService.isSellerOrAdmin(role);
```

### Route Protection

Routes are automatically protected by middleware:

```typescript
// Protected routes configuration
const PROTECTED_ROUTES = {
  '/admin': ['admin'],                    // Admin only
  '/seller': ['seller', 'admin'],         // Sellers and admins
  '/dashboard': ['customer', 'seller', 'admin'], // All authenticated users
  '/apply-seller': ['customer'],          // Customers only (to become sellers)
  '/submit-event': ['seller', 'admin'],   // Event creators only
};
```

### Component-Level Access Control

```tsx
import { 
  RoleBasedAccess, 
  AdminOnly, 
  SellerOrAdmin,
  AuthenticatedOnly,
  useRoleCheck 
} from '@/components/auth/RoleBasedAccess';

// Basic role-based rendering
function MyComponent() {
  return (
    <>
      <RoleBasedAccess allowedRoles="admin">
        <AdminPanel />
      </RoleBasedAccess>

      <RoleBasedAccess allowedRoles={["seller", "admin"]}>
        <EventManagement />
      </RoleBasedAccess>

      <AuthenticatedOnly fallback={<LoginPrompt />}>
        <UserDashboard />
      </AuthenticatedOnly>
    </>
  );
}

// Using convenience components
function Navigation() {
  return (
    <nav>
      <AdminOnly>
        <AdminNavItems />
      </AdminOnly>
      
      <SellerOrAdmin>
        <SellerNavItems />
      </SellerOrAdmin>
    </nav>
  );
}

// Using role check hooks
function EventCard({ event }) {
  const { hasRole, isAdmin, isSeller } = useRoleCheck();
  
  return (
    <div>
      <h3>{event.title}</h3>
      {hasRole(['seller', 'admin']) && (
        <EditButton eventId={event.id} />
      )}
      {isAdmin && (
        <DeleteButton eventId={event.id} />
      )}
    </div>
  );
}
```

### Database Queries with RLS

RLS policies automatically filter data based on the user's role:

```typescript
// This query automatically respects RLS policies
const { data: events } = await supabase
  .from('events')
  .select('*');

// Customers see only active events
// Sellers see their own events + active events from others
// Admins see all events

// Role-specific queries
const { data: userEvents } = await supabase
  .from('events')
  .select('*')
  .eq('seller_id', user.id); // Sellers can only see their own events
```

### API Route Protection

```typescript
// In API routes, check roles using headers or JWT
export async function POST(request: NextRequest) {
  const userRole = request.headers.get('x-user-role');
  
  if (!['seller', 'admin'].includes(userRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // Proceed with seller/admin logic
}
```

## Role Permissions Matrix

| Feature | Customer | Seller | Admin |
|---------|----------|--------|-------|
| Browse events | ✅ | ✅ | ✅ |
| Buy tickets | ✅ | ✅ | ✅ |
| Apply to be seller | ✅ | ❌ | ❌ |
| Create events | ❌ | ✅ | ✅ |
| Manage own events | ❌ | ✅ | ✅ |
| View own sales | ❌ | ✅ | ✅ |
| Approve sellers | ❌ | ❌ | ✅ |
| Manage all events | ❌ | ❌ | ✅ |
| User management | ❌ | ❌ | ✅ |
| Platform analytics | ❌ | ❌ | ✅ |

## Security Features

1. **JWT with Role Claims**: Roles are embedded in JWT tokens for client-side checks
2. **Server-Side Validation**: All role checks are verified server-side
3. **Database-Level Security**: RLS policies prevent unauthorized data access
4. **Route Protection**: Middleware prevents access to unauthorized routes
5. **Token Refresh**: Automatic token refresh maintains role claims

## Migration from Simple Auth

To migrate existing components:

1. Replace `useAuth()` role checks with `useRoleCheck()` hooks
2. Wrap role-specific components with `RoleBasedAccess`
3. Update API routes to use role headers or JWT validation
4. Apply the database migration for RLS policies

This RBAC system provides a secure, scalable foundation for role-based access control while maintaining backward compatibility with existing authentication flows.

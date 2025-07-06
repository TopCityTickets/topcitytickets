-- Enhanced RBAC System for Ticketing Platform
-- This migration creates custom roles and RLS policies

-- Create custom roles
CREATE ROLE ticketing_customer;
CREATE ROLE ticketing_seller;
CREATE ROLE ticketing_admin;

-- Grant roles to the authenticator (required for JWT)
GRANT ticketing_customer TO authenticator;
GRANT ticketing_seller TO authenticator;
GRANT ticketing_admin TO authenticator;

-- Grant anon to all roles (allows unauthenticated access where needed)
GRANT anon TO ticketing_customer;
GRANT anon TO ticketing_seller;
GRANT anon TO ticketing_admin;

-- Enable RLS on all tables
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Function to get the current user's role from JWT or database
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID DEFAULT auth.uid())
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- First try to get role from JWT claims
  SELECT (auth.jwt() ->> 'user_role') INTO user_role;
  
  -- If not in JWT, get from users table
  IF user_role IS NULL THEN
    SELECT role INTO user_role FROM users WHERE id = user_id;
  END IF;
  
  RETURN COALESCE(user_role, 'customer');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has admin access
CREATE OR REPLACE FUNCTION is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role(user_id) = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is seller or admin
CREATE OR REPLACE FUNCTION is_seller_or_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role(user_id) IN ('seller', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- EVENTS TABLE POLICIES
-- Everyone can read approved/active events
CREATE POLICY "Events are viewable by everyone" ON events
  FOR SELECT USING (is_active = true);

-- Sellers can create events
CREATE POLICY "Sellers can create events" ON events
  FOR INSERT WITH CHECK (
    auth.uid() = seller_id AND 
    get_user_role() IN ('seller', 'admin')
  );

-- Sellers can update their own events, admins can update any
CREATE POLICY "Sellers can update own events" ON events
  FOR UPDATE USING (
    (auth.uid() = seller_id AND get_user_role() IN ('seller', 'admin')) OR
    is_admin()
  );

-- Sellers can delete their own events, admins can delete any
CREATE POLICY "Sellers can delete own events" ON events
  FOR DELETE USING (
    (auth.uid() = seller_id AND get_user_role() IN ('seller', 'admin')) OR
    is_admin()
  );

-- Admins can view all events (including inactive)
CREATE POLICY "Admins can view all events" ON events
  FOR SELECT TO ticketing_admin USING (is_admin());

-- EVENT SUBMISSIONS POLICIES
-- Sellers can view their own submissions
CREATE POLICY "Sellers can view own submissions" ON event_submissions
  FOR SELECT USING (
    auth.uid() = seller_id AND get_user_role() IN ('seller', 'admin')
  );

-- Sellers can create submissions
CREATE POLICY "Sellers can create submissions" ON event_submissions
  FOR INSERT WITH CHECK (
    auth.uid() = seller_id AND 
    get_user_role() IN ('seller', 'admin')
  );

-- Sellers can update their pending submissions
CREATE POLICY "Sellers can update pending submissions" ON event_submissions
  FOR UPDATE USING (
    auth.uid() = seller_id AND 
    status = 'pending' AND
    get_user_role() IN ('seller', 'admin')
  );

-- Admins can view and manage all submissions
CREATE POLICY "Admins can manage all submissions" ON event_submissions
  FOR ALL TO ticketing_admin USING (is_admin());

-- USERS TABLE POLICIES
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Admins can view and manage all users
CREATE POLICY "Admins can manage all users" ON users
  FOR ALL TO ticketing_admin USING (is_admin());

-- Allow new user registration
CREATE POLICY "Allow user registration" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_seller_id ON events(seller_id);
CREATE INDEX IF NOT EXISTS idx_events_active ON events(is_active);
CREATE INDEX IF NOT EXISTS idx_event_submissions_seller_id ON event_submissions(seller_id);
CREATE INDEX IF NOT EXISTS idx_event_submissions_status ON event_submissions(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

COMMENT ON FUNCTION get_user_role IS 'Returns the role of the user from JWT claims or database';
COMMENT ON FUNCTION is_admin IS 'Checks if the user has admin privileges';
COMMENT ON FUNCTION is_seller_or_admin IS 'Checks if the user is a seller or admin';

-- Fix RLS recursion issues in users table policies
-- This migration fixes the 500 errors caused by infinite recursion in admin policies

-- First, drop all existing problematic policies
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;

-- Create a helper function to check admin status without recursion
CREATE OR REPLACE FUNCTION is_current_user_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_role text;
BEGIN
  -- Use a direct query with SECURITY DEFINER to bypass RLS temporarily
  -- This function runs with elevated privileges to avoid recursion
  SELECT role INTO user_role 
  FROM users 
  WHERE id = auth.uid()
  LIMIT 1;
  
  RETURN COALESCE(user_role = 'admin', false);
EXCEPTION
  WHEN OTHERS THEN
    -- If any error occurs, default to false (not admin)
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_current_user_admin() TO authenticated;

-- Create non-recursive admin policies using the helper function
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (is_current_user_admin());

CREATE POLICY "Admins can update all users" ON users
    FOR UPDATE USING (is_current_user_admin());

-- Also add a policy for public viewing of basic user info (needed for events, tickets, etc.)
DROP POLICY IF EXISTS "Public can view basic user info" ON users;
CREATE POLICY "Public can view basic user info" ON users
    FOR SELECT USING (true);

-- Ensure users can still view and update their own profiles
-- These policies should already exist but let's make sure they're correct
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Allow users to insert their own profile during signup
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Update the helper functions to also use non-recursive admin checks
CREATE OR REPLACE FUNCTION review_seller_application(
    user_id UUID,
    approved BOOLEAN,
    admin_id UUID,
    feedback TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    user_record RECORD;
    is_admin BOOLEAN;
BEGIN
    -- Check if the calling user is an admin using our safe function
    SELECT is_current_user_admin() INTO is_admin;
    
    IF NOT is_admin THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Admin access required');
    END IF;
    
    -- Get user record
    SELECT * INTO user_record FROM users WHERE id = user_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;
    
    -- Check if application is pending
    IF user_record.seller_status != 'pending' THEN
        RETURN jsonb_build_object('success', false, 'error', 'No pending application found');
    END IF;
    
    -- Update user based on approval
    IF approved THEN
        UPDATE users 
        SET 
            seller_status = 'approved',
            role = 'seller',
            seller_approved_at = NOW(),
            seller_denied_at = NULL,
            can_reapply_at = NULL,
            admin_notes = feedback,
            updated_at = NOW()
        WHERE id = user_id;
    ELSE
        UPDATE users 
        SET 
            seller_status = 'denied',
            seller_denied_at = NOW(),
            seller_approved_at = NULL,
            can_reapply_at = NOW() + INTERVAL '30 days',
            admin_notes = feedback,
            updated_at = NOW()
        WHERE id = user_id;
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', CASE WHEN approved THEN 'Seller application approved' ELSE 'Seller application denied' END,
        'approved', approved
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

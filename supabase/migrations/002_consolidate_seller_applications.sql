-- Migration: Consolidate seller applications into users table
-- This migration adds seller application fields to the users table
-- and makes it the single source of truth for seller status

-- Add new seller application fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS seller_business_type TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS seller_contact_email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS seller_contact_phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS seller_denied_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Add Stripe-related columns if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_connect_account_id TEXT;

-- Update role enum to include 'customer' as default instead of just 'user'
-- (Keep existing roles for backward compatibility)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'seller', 'customer', 'user');
    END IF;
END $$;

-- Update users table to use the enum (if not already using it)
-- ALTER TABLE users ALTER COLUMN role TYPE user_role USING role::user_role;

-- Update seller_status to be more explicit
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'seller_status_type') THEN
        CREATE TYPE seller_status_type AS ENUM ('none', 'pending', 'approved', 'denied');
    END IF;
END $$;

-- Update users table to use the seller_status enum (if not already using it)
-- ALTER TABLE users ALTER COLUMN seller_status TYPE seller_status_type USING seller_status::seller_status_type;

-- Set default values for new users
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'customer';
ALTER TABLE users ALTER COLUMN seller_status SET DEFAULT 'none';
-- Only set default for stripe_onboarding_completed if column exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'users' AND column_name = 'stripe_onboarding_completed') THEN
        ALTER TABLE users ALTER COLUMN stripe_onboarding_completed SET DEFAULT false;
    END IF;
END $$;

-- Create indexes for better performance on seller application queries
CREATE INDEX IF NOT EXISTS idx_users_seller_status ON users(seller_status);
CREATE INDEX IF NOT EXISTS idx_users_seller_applied_at ON users(seller_applied_at);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Create a function to apply for seller status
CREATE OR REPLACE FUNCTION apply_for_seller_status(
    user_id UUID,
    business_name TEXT,
    business_type TEXT,
    business_description TEXT DEFAULT NULL,
    contact_email TEXT DEFAULT NULL,
    contact_phone TEXT DEFAULT NULL,
    website_url TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    result JSONB;
    user_record RECORD;
BEGIN
    -- Get current user data
    SELECT * INTO user_record FROM users WHERE id = user_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'User not found'
        );
    END IF;
    
    -- Check if user can apply
    IF user_record.seller_status = 'pending' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Application already pending'
        );
    END IF;
    
    IF user_record.seller_status = 'approved' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'User is already an approved seller'
        );
    END IF;
    
    -- Check reapply date if previously denied
    IF user_record.seller_status = 'denied' AND user_record.can_reapply_at IS NOT NULL THEN
        IF user_record.can_reapply_at > NOW() THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Cannot reapply yet',
                'can_reapply_at', user_record.can_reapply_at
            );
        END IF;
    END IF;
    
    -- Update user with application data
    UPDATE users 
    SET 
        seller_status = 'pending',
        seller_business_name = business_name,
        seller_business_type = business_type,
        seller_description = business_description,
        seller_contact_email = COALESCE(contact_email, email),
        seller_contact_phone = contact_phone,
        website_url = website_url,
        seller_applied_at = NOW(),
        seller_approved_at = NULL,
        seller_denied_at = NULL,
        can_reapply_at = NULL,
        admin_notes = NULL,
        updated_at = NOW()
    WHERE id = user_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Seller application submitted successfully'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to approve/deny seller applications
CREATE OR REPLACE FUNCTION review_seller_application(
    user_id UUID,
    approved BOOLEAN,
    admin_id UUID,
    feedback TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    user_record RECORD;
    admin_record RECORD;
BEGIN
    -- Verify admin
    SELECT * INTO admin_record FROM users WHERE id = admin_id AND role = 'admin';
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Unauthorized: Admin access required'
        );
    END IF;
    
    -- Get user record
    SELECT * INTO user_record FROM users WHERE id = user_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'User not found'
        );
    END IF;
    
    -- Check if application is pending
    IF user_record.seller_status != 'pending' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'No pending application found'
        );
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

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION apply_for_seller_status TO authenticated;
GRANT EXECUTE ON FUNCTION review_seller_application TO authenticated;

-- Create RLS policies for the updated users table
-- Enable RLS on users table (if not already enabled)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (if they exist) and recreate them
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;

-- Users can view their own profile
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile (but not role/admin fields)
CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Admins can update all users
CREATE POLICY "Admins can update all users" ON users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Create a view for seller applications (for admin interface)
CREATE OR REPLACE VIEW pending_seller_applications AS
SELECT 
    id,
    email,
    first_name,
    last_name,
    seller_business_name,
    seller_business_type,
    seller_description,
    seller_contact_email,
    seller_contact_phone,
    website_url,
    seller_applied_at,
    admin_notes
FROM users 
WHERE seller_status = 'pending'
ORDER BY seller_applied_at ASC;

-- Grant access to the view
GRANT SELECT ON pending_seller_applications TO authenticated;

COMMENT ON TABLE users IS 'Users table with consolidated seller application data';
COMMENT ON FUNCTION apply_for_seller_status IS 'Function to apply for seller status - updates users table directly';
COMMENT ON FUNCTION review_seller_application IS 'Function for admins to approve/deny seller applications';
COMMENT ON VIEW pending_seller_applications IS 'View of pending seller applications for admin interface';

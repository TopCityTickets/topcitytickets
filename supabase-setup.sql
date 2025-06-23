-- SUPABASE DATABASE SETUP FOR TOPCITYTICKETS
-- Run this entire script in your Supabase SQL Editor

-- ===========================================
-- 1. USERS TABLE SETUP
-- ===========================================

-- Drop existing users table if it exists
DROP TABLE IF EXISTS public.users CASCADE;

-- Recreate users table with proper types
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'seller', 'admin')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Admin can read all data" ON public.users;

-- User policies
CREATE POLICY "Users can read own data" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admin can read all data" ON public.users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, role)
    VALUES (new.id, new.email, 'user');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reset trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===========================================
-- 2. EVENTS TABLE SETUP
-- ===========================================

-- Create events table
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    venue TEXT NOT NULL,
    ticket_price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    slug TEXT UNIQUE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organizer_email TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Enable RLS for events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Anyone can view approved events" ON public.events;
DROP POLICY IF EXISTS "Users can view own events" ON public.events;
DROP POLICY IF EXISTS "Sellers can create events" ON public.events;
DROP POLICY IF EXISTS "Users can update own events" ON public.events;
DROP POLICY IF EXISTS "Admins can approve events" ON public.events;

-- Events policies
CREATE POLICY "Anyone can view approved events" ON public.events
    FOR SELECT USING (is_approved = true);

CREATE POLICY "Users can view own events" ON public.events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Sellers can create events" ON public.events
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('seller', 'admin')
        )
    );

CREATE POLICY "Users can update own events" ON public.events
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can approve events" ON public.events
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- ===========================================
-- 3. EVENT SUBMISSIONS TABLE SETUP
-- ===========================================

-- Create event submissions table (for approval workflow)
CREATE TABLE IF NOT EXISTS public.event_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    venue TEXT NOT NULL,
    ticket_price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    slug TEXT,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organizer_email TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Enable RLS for event submissions
ALTER TABLE public.event_submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own submissions" ON public.event_submissions;
DROP POLICY IF EXISTS "Sellers can create submissions" ON public.event_submissions;
DROP POLICY IF EXISTS "Users can update own submissions" ON public.event_submissions;
DROP POLICY IF EXISTS "Admins can view all submissions" ON public.event_submissions;
DROP POLICY IF EXISTS "Admins can update submissions" ON public.event_submissions;

-- Event submissions policies
CREATE POLICY "Users can view own submissions" ON public.event_submissions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Sellers can create submissions" ON public.event_submissions
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('seller', 'admin')
        )
    );

CREATE POLICY "Users can update own submissions" ON public.event_submissions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all submissions" ON public.event_submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update submissions" ON public.event_submissions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- ===========================================
-- 4. SELLER APPLICATIONS TABLE SETUP
-- ===========================================

-- Create seller applications table
CREATE TABLE IF NOT EXISTS public.seller_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES auth.users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_seller_applications_user_id ON seller_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_seller_applications_status ON seller_applications(status);

-- Enable RLS
ALTER TABLE public.seller_applications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own applications" ON public.seller_applications;
DROP POLICY IF EXISTS "Users can create applications" ON public.seller_applications;
DROP POLICY IF EXISTS "Admins can view all applications" ON public.seller_applications;
DROP POLICY IF EXISTS "Admins can update applications" ON public.seller_applications;

-- Policies for seller_applications
CREATE POLICY "Users can view own applications" ON public.seller_applications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create applications" ON public.seller_applications
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND 
        NOT EXISTS (
            SELECT 1 FROM seller_applications 
            WHERE user_id = auth.uid() AND status = 'pending'
        )
    );

CREATE POLICY "Admins can view all applications" ON public.seller_applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update applications" ON public.seller_applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Function to automatically update user role when application is approved
CREATE OR REPLACE FUNCTION handle_seller_application_approval()
RETURNS TRIGGER AS $$
BEGIN
    -- If application was approved, update user role to 'seller'
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        UPDATE users 
        SET role = 'seller', updated_at = NOW()
        WHERE id = NEW.user_id;
        
        -- Set reviewed timestamp
        NEW.reviewed_at = NOW();
        NEW.reviewed_by = auth.uid();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_seller_application_approved ON seller_applications;
CREATE TRIGGER on_seller_application_approved
    BEFORE UPDATE ON seller_applications
    FOR EACH ROW
    EXECUTE FUNCTION handle_seller_application_approval();

-- ===========================================
-- 5. UPDATED_AT TRIGGERS
-- ===========================================

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_event_submissions_updated_at ON event_submissions;
CREATE TRIGGER update_event_submissions_updated_at
    BEFORE UPDATE ON event_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_seller_applications_updated_at ON seller_applications;
CREATE TRIGGER update_seller_applications_updated_at
    BEFORE UPDATE ON seller_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- 6. SAMPLE DATA AND ADMIN SETUP
-- ===========================================

-- NOTE: After running this script, sign up with topcitytickets@gmail.com
-- Then run this query to make yourself admin:
-- UPDATE users SET role = 'admin' WHERE email = 'topcitytickets@gmail.com';

-- Verify setup
SELECT 'Database setup completed successfully!' as status;

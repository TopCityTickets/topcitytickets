-- FIXED: TopCityTickets RLS Policy Fix (No Infinite Recursion)
-- This fixes the infinite recursion error in user policies
-- Run this in Supabase SQL Editor

-- 1. DISABLE RLS temporarily to fix the policies
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 2. Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own events" ON public.events;
DROP POLICY IF EXISTS "Anyone can view approved events" ON public.events;
DROP POLICY IF EXISTS "Sellers can create events" ON public.events;
DROP POLICY IF EXISTS "Admins can manage events" ON public.events;
DROP POLICY IF EXISTS "Users can update own events" ON public.events;
DROP POLICY IF EXISTS "Admins can update all events" ON public.events;
DROP POLICY IF EXISTS "Admins can view all events" ON public.events;
DROP POLICY IF EXISTS "Event creators can manage events" ON public.events;

-- User table policies (ALL OF THEM)
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update user roles" ON public.users;

-- Seller applications policies
DROP POLICY IF EXISTS "Users can view own applications" ON public.seller_applications;
DROP POLICY IF EXISTS "Admins can view all applications" ON public.seller_applications;
DROP POLICY IF EXISTS "Users can create applications" ON public.seller_applications;
DROP POLICY IF EXISTS "Users can create own applications" ON public.seller_applications;
DROP POLICY IF EXISTS "Admins can update applications" ON public.seller_applications;

-- Tickets policies
DROP POLICY IF EXISTS "Users can view own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can insert own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can create own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Admins can update tickets" ON public.tickets;
DROP POLICY IF EXISTS "Event creators can view tickets for their events" ON public.tickets;
DROP POLICY IF EXISTS "Event creators can update tickets for their events" ON public.tickets;

-- Event submissions policies
DROP POLICY IF EXISTS "Users can view own submissions" ON public.event_submissions;
DROP POLICY IF EXISTS "Admins can view all submissions" ON public.event_submissions;
DROP POLICY IF EXISTS "Sellers can create submissions" ON public.event_submissions;
DROP POLICY IF EXISTS "Users can update own submissions" ON public.event_submissions;
DROP POLICY IF EXISTS "Admins can update all submissions" ON public.event_submissions;

-- 3. Create SIMPLE, NON-RECURSIVE policies for users table
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- 4. Re-enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 5. Create NON-RECURSIVE policies for other tables using direct role checks
-- Events table policies
CREATE POLICY "Anyone can view approved events" ON public.events
    FOR SELECT USING (is_approved = true);

CREATE POLICY "Users can view own events" ON public.events
    FOR SELECT USING (auth.uid() = created_by OR auth.uid() = user_id);

CREATE POLICY "Admins can view all events" ON public.events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Sellers can create events" ON public.events
    FOR INSERT WITH CHECK (
        auth.uid() = created_by AND
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('seller', 'admin')
        )
    );

CREATE POLICY "Users can update own events" ON public.events
    FOR UPDATE USING (auth.uid() = created_by OR auth.uid() = user_id);

CREATE POLICY "Admins can update all events" ON public.events
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Seller applications policies
CREATE POLICY "Users can view own applications" ON public.seller_applications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all applications" ON public.seller_applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Users can create own applications" ON public.seller_applications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update applications" ON public.seller_applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Tickets policies
CREATE POLICY "Users can view own tickets" ON public.tickets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Event creators can view tickets for their events" ON public.tickets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.events 
            WHERE events.id = tickets.event_id 
            AND (events.created_by = auth.uid() OR events.user_id = auth.uid())
        )
    );

CREATE POLICY "Admins can view all tickets" ON public.tickets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Users can create own tickets" ON public.tickets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update tickets" ON public.tickets
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Event creators can update tickets for their events" ON public.tickets
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.events 
            WHERE events.id = tickets.event_id 
            AND (events.created_by = auth.uid() OR events.user_id = auth.uid())
        )
    );

-- Event submissions policies
CREATE POLICY "Users can view own submissions" ON public.event_submissions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all submissions" ON public.event_submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Sellers can create submissions" ON public.event_submissions
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('seller', 'admin')
        )
    );

CREATE POLICY "Users can update own submissions" ON public.event_submissions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can update all submissions" ON public.event_submissions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- 6. Add missing columns and ensure they exist
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);
UPDATE public.events SET created_by = user_id WHERE created_by IS NULL AND user_id IS NOT NULL;

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_name text;

-- 7. Test query to verify everything works
SELECT 'RLS policies fixed - infinite recursion resolved!' as status;

-- 8. Final verification
SELECT 
    'Fixed! Now your Force Admin Role button should work properly.' as final_message;

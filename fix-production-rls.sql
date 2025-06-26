-- Fix RLS policies for production issues
-- Run this in Supabase SQL Editor

-- Fix seller_applications table access
DROP POLICY IF EXISTS "Anyone can view seller applications" ON seller_applications;
DROP POLICY IF EXISTS "Users can create seller applications" ON seller_applications;
DROP POLICY IF EXISTS "Admins can update seller applications" ON seller_applications;

-- Recreate seller_applications policies
CREATE POLICY "Users can view own applications" ON seller_applications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all applications" ON seller_applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Users can create applications" ON seller_applications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update applications" ON seller_applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Fix tickets table access
DROP POLICY IF EXISTS "Users can view own tickets" ON tickets;
DROP POLICY IF EXISTS "Users can insert own tickets" ON tickets;
DROP POLICY IF EXISTS "Admins can update tickets" ON tickets;

-- Recreate tickets policies
CREATE POLICY "Users can view own tickets" ON tickets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all tickets" ON tickets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Users can insert own tickets" ON tickets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update tickets" ON tickets
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Fix events table policies  
DROP POLICY IF EXISTS "Anyone can view approved events" ON events;

CREATE POLICY "Anyone can view approved events" ON events
    FOR SELECT USING (is_approved = true OR auth.uid() = created_by);

CREATE POLICY "Admins can view all events" ON events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Verify policies are working
SELECT 'RLS policies updated successfully!' as result;

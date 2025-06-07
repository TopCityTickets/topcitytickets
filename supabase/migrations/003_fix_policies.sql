-- First drop all existing policies
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can submit applications" ON public.seller_applications;
DROP POLICY IF EXISTS "Users can view own applications" ON public.seller_applications;
DROP POLICY IF EXISTS "Anyone can view approved events" ON public.events;
DROP POLICY IF EXISTS "Sellers can view own events" ON public.events;
DROP POLICY IF EXISTS "Sellers can submit events" ON public.event_submissions;
DROP POLICY IF EXISTS "Users can view own submissions" ON public.event_submissions;
DROP POLICY IF EXISTS "Admin bypass for events" ON public.events;
DROP POLICY IF EXISTS "Admin bypass for event_submissions" ON public.event_submissions;
DROP POLICY IF EXISTS "Admin bypass for seller_applications" ON public.seller_applications;

-- Add admin bypass policies first
CREATE POLICY "Admin bypass for all tables" ON public.users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Then recreate regular policies
CREATE POLICY "Users can read own data" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can submit applications" ON public.seller_applications
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        NOT EXISTS (
            SELECT 1 FROM public.seller_applications
            WHERE user_id = auth.uid() AND status = 'pending'
        )
    );

-- ... add the rest of your policies here ...

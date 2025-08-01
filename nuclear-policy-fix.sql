-- NUCLEAR OPTION: Force drop all policies and recreate safely
-- This will forcefully remove ALL policies and stop the recursion

-- First, disable RLS completely to stop any current recursion
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_applications DISABLE ROW LEVEL SECURITY;

-- Get all policy names and drop them (this query will show what policies exist)
DO $$
DECLARE
    pol_record RECORD;
BEGIN
    -- Drop all policies on profiles table
    FOR pol_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol_record.policyname || '" ON public.profiles';
    END LOOP;
    
    -- Drop all policies on events table
    FOR pol_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'events' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol_record.policyname || '" ON public.events';
    END LOOP;
    
    -- Drop all policies on seller_applications table
    FOR pol_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'seller_applications' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol_record.policyname || '" ON public.seller_applications';
    END LOOP;
    
    -- Drop all policies on roles table if it exists
    FOR pol_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'roles' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol_record.policyname || '" ON public.roles';
    END LOOP;
END
$$;

-- Now create simple, safe policies without recursion
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_applications ENABLE ROW LEVEL SECURITY;

-- Safe profiles policies (no recursion)
CREATE POLICY "profiles_own_only" ON public.profiles 
    FOR ALL USING (auth.uid() = id);

-- Safe events policies  
CREATE POLICY "events_read_all" ON public.events 
    FOR SELECT USING (true);
    
CREATE POLICY "events_write_owner" ON public.events 
    FOR INSERT WITH CHECK (auth.uid() = seller_id);
    
CREATE POLICY "events_update_owner" ON public.events 
    FOR UPDATE USING (auth.uid() = seller_id);

-- Safe seller applications policies
CREATE POLICY "applications_own_only" ON public.seller_applications 
    FOR ALL USING (auth.uid() = user_id);

SELECT 'All policies forcefully cleared and recreated safely!' as status;

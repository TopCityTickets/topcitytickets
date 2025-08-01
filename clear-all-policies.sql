-- EMERGENCY FIX: Remove all policies and stop infinite recursion
-- Run this FIRST to clear everything and stop the recursion

-- Disable RLS immediately to stop recursion
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.events DISABLE ROW LEVEL SECURITY; 
ALTER TABLE IF EXISTS public.seller_applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.roles DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies (even if they don't exist, won't error)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Only admins can manage roles" ON public.roles;

DROP POLICY IF EXISTS "Anyone can view active events" ON public.events;
DROP POLICY IF EXISTS "Sellers can view own events" ON public.events;
DROP POLICY IF EXISTS "Users can view all events if authenticated" ON public.events;
DROP POLICY IF EXISTS "Users with create_events permission can create events" ON public.events;
DROP POLICY IF EXISTS "Users can update own events with manage_own_events permission" ON public.events;
DROP POLICY IF EXISTS "Users with manage_all_events can view all events" ON public.events;
DROP POLICY IF EXISTS "Users with manage_all_events can update any event" ON public.events;
DROP POLICY IF EXISTS "Admins can update any event" ON public.events;
DROP POLICY IF EXISTS "Sellers can create events" ON public.events;
DROP POLICY IF EXISTS "Users can update own events" ON public.events;

DROP POLICY IF EXISTS "Users can view own applications" ON public.seller_applications;
DROP POLICY IF EXISTS "Users can create own applications" ON public.seller_applications;
DROP POLICY IF EXISTS "Admins can view all applications" ON public.seller_applications;
DROP POLICY IF EXISTS "Admins can update applications" ON public.seller_applications;

-- Drop any other policies that might exist
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "events_select" ON public.events;
DROP POLICY IF EXISTS "events_insert" ON public.events;
DROP POLICY IF EXISTS "events_update" ON public.events;
DROP POLICY IF EXISTS "seller_applications_select" ON public.seller_applications;
DROP POLICY IF EXISTS "seller_applications_insert" ON public.seller_applications;

-- Re-enable RLS
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.seller_applications ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies
CREATE POLICY "profile_own_access" ON public.profiles 
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "events_public_read" ON public.events 
  FOR SELECT USING (true);

CREATE POLICY "events_owner_write" ON public.events 
  FOR ALL USING (auth.uid() = seller_id OR auth.uid() IS NOT NULL);

CREATE POLICY "applications_own_access" ON public.seller_applications 
  FOR ALL USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
GRANT ALL ON public.seller_applications TO authenticated;
GRANT ALL ON public.seller_applications TO service_role;

SELECT 'All policies cleared and simple ones applied - recursion fixed!' as status;

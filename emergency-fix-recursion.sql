-- Emergency Fix: Disable RLS temporarily to stop infinite recursion
-- Run this in your Supabase SQL Editor to immediately fix the issue

-- Disable RLS on all tables to stop recursion
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY; 
ALTER TABLE public.seller_applications DISABLE ROW LEVEL SECURITY;

-- Drop all problematic policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view active events" ON public.events;
DROP POLICY IF EXISTS "Users can view all events if authenticated" ON public.events;
DROP POLICY IF EXISTS "Users with create_events permission can create events" ON public.events;
DROP POLICY IF EXISTS "Users can update own events with manage_own_events permission" ON public.events;
DROP POLICY IF EXISTS "Admins can update any event" ON public.events;
DROP POLICY IF EXISTS "Users can view own applications" ON public.seller_applications;
DROP POLICY IF EXISTS "Users can create own applications" ON public.seller_applications;
DROP POLICY IF EXISTS "Admins can view all applications" ON public.seller_applications;
DROP POLICY IF EXISTS "Admins can update applications" ON public.seller_applications;

-- Re-enable RLS with simple, non-recursive policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_applications ENABLE ROW LEVEL SECURITY;

-- Simple policies without recursion
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);  
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "events_select" ON public.events FOR SELECT USING (true);
CREATE POLICY "events_insert" ON public.events FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "events_update" ON public.events FOR UPDATE USING (auth.uid() = seller_id);

CREATE POLICY "seller_applications_select" ON public.seller_applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "seller_applications_insert" ON public.seller_applications FOR INSERT WITH CHECK (auth.uid() = user_id);

SELECT 'Emergency fix applied - recursion stopped!' as status;

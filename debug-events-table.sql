-- Debug Events Table Access
-- Run this in Supabase SQL Editor to check if events are accessible

-- 1. Check if events table exists and has data
SELECT 
  'Events Table Status' as check_type,
  count(*) as total_events,
  count(*) FILTER (WHERE status = 'approved') as approved_events,
  array_agg(DISTINCT status) as statuses_found
FROM public.events;

-- 2. Check sample events with IDs and slugs
SELECT 
  id,
  slug,
  name,
  status,
  created_at
FROM public.events 
ORDER BY created_at DESC 
LIMIT 10;

-- 3. Check RLS policies on events table
SELECT 
  'Events RLS Policies' as check_type,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'events'
ORDER BY policyname;

-- 4. Test anonymous access to events (what users see)
SET ROLE anon;
SELECT 
  'Anonymous Access Test' as check_type,
  count(*) as accessible_events
FROM public.events;
RESET ROLE;

-- 5. Check if there are any triggers affecting event access
SELECT 
  'Event Triggers' as check_type,
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers 
WHERE event_object_schema = 'public' 
AND event_object_table = 'events'
ORDER BY trigger_name;

SELECT 'Event table debug complete!' as result;

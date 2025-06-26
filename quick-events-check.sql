-- Quick Events Table Structure Check
-- Run this in Supabase SQL Editor

-- 1. Check events table columns
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'events'
ORDER BY ordinal_position;

-- 2. Check current events data
SELECT 
  id,
  name,
  is_approved,
  slug,
  date,
  created_at,
  user_id,
  created_by
FROM public.events 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Check if there are any events at all
SELECT 
  count(*) as total_events,
  count(CASE WHEN is_approved = true THEN 1 END) as approved_events,
  count(CASE WHEN is_approved = false THEN 1 END) as unapproved_events
FROM public.events;

SELECT 'Events table structure check complete!' as result;

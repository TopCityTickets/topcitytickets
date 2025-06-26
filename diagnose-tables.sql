-- Simple diagnostic queries to see what's happening
-- Run each section separately in Supabase SQL Editor

-- 1. Check if events table exists and show its structure
SELECT 
  'events' as table_name,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'events'
  ) as table_exists;

-- 2. Show events table columns (run this only if table exists)
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'events'
ORDER BY ordinal_position;

-- 3. Check RLS status on all our tables
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('events', 'event_submissions', 'users', 'seller_applications')
ORDER BY tablename;

-- 4. Count policies on all our tables
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename IN ('events', 'event_submissions', 'users', 'seller_applications')
GROUP BY tablename
ORDER BY tablename;

-- 5. Try to count events (will show error if table doesn't exist)
SELECT COUNT(*) as event_count FROM events;

-- 6. Show any recent event_submissions
SELECT 
  id,
  name,
  status,
  created_at,
  user_id
FROM event_submissions 
ORDER BY created_at DESC 
LIMIT 5;

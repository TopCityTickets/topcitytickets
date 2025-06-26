-- Diagnostic query to see actual event_submissions table structure
-- Run this in Supabase SQL Editor first

SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'event_submissions'
ORDER BY ordinal_position;

-- Show all event submissions with key fields
SELECT 
  id,
  name,
  status,
  slug,
  approved_at,
  admin_feedback,
  organizer_email,
  created_at
FROM event_submissions 
ORDER BY created_at DESC;

-- Check if there are any approved events
SELECT COUNT(*) as approved_count FROM event_submissions WHERE status = 'approved';

-- Check events table for approved events
SELECT 
  id,
  name, 
  slug,
  is_approved,
  created_at
FROM events
WHERE is_approved = true
ORDER BY created_at DESC;

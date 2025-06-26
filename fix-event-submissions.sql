-- Fix event submissions table access
-- Make sure event_submissions table is accessible for submissions

-- Disable RLS on event_submissions if not already done
ALTER TABLE event_submissions DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies that might be blocking access
DROP POLICY IF EXISTS "Users can view own submissions" ON event_submissions;
DROP POLICY IF EXISTS "Users can create submissions" ON event_submissions;
DROP POLICY IF EXISTS "Admins can view all submissions" ON event_submissions;
DROP POLICY IF EXISTS "Authenticated users can insert submissions" ON event_submissions;

-- Check what's in the table
DO $check_submissions$
DECLARE
  submission_record RECORD;
  count_submissions INTEGER;
BEGIN
  RAISE NOTICE '=== EVENT SUBMISSIONS DEBUG ===';
  
  -- Count total submissions
  SELECT COUNT(*) INTO count_submissions FROM event_submissions;
  RAISE NOTICE 'Total submissions in event_submissions: %', count_submissions;
  
  -- Show ALL submissions
  RAISE NOTICE '=== ALL EVENT SUBMISSIONS ===';
  FOR submission_record IN
    SELECT 
      id,
      user_id,
      name,
      status,
      created_at
    FROM event_submissions
    ORDER BY created_at DESC
  LOOP
    RAISE NOTICE 'Submission: % | User: % | Name: % | Status: % | Created: %', 
      submission_record.id,
      submission_record.user_id,
      submission_record.name,
      submission_record.status,
      submission_record.created_at;
  END LOOP;
  
END $check_submissions$;

-- Verify RLS status
DO $rls_check$
DECLARE
  rls_status RECORD;
BEGIN
  RAISE NOTICE '=== RLS STATUS FOR EVENT_SUBMISSIONS ===';
  
  SELECT tablename, rowsecurity INTO rls_status
  FROM pg_tables 
  WHERE schemaname = 'public' 
  AND tablename = 'event_submissions';
  
  RAISE NOTICE 'Table: % | RLS Enabled: %', rls_status.tablename, rls_status.rowsecurity;
  
END $rls_check$;

ANALYZE event_submissions;

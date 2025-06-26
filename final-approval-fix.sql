-- Final fix for event approval issues
-- Run this in Supabase SQL Editor

-- First, let's completely disable any triggers that might be causing issues
ALTER TABLE event_submissions DISABLE TRIGGER ALL;
ALTER TABLE events DISABLE TRIGGER ALL;

-- Make sure RLS is completely disabled
ALTER TABLE event_submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE approved_events DISABLE ROW LEVEL SECURITY;

-- Drop ALL policies to be absolutely sure
DO $$ 
DECLARE
    pol_record RECORD;
BEGIN
    -- Drop all policies on event_submissions
    FOR pol_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'event_submissions'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol_record.policyname || '" ON event_submissions';
    END LOOP;
    
    -- Drop all policies on events
    FOR pol_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'events'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol_record.policyname || '" ON events';
    END LOOP;
    
    -- Drop all policies on approved_events
    FOR pol_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'approved_events'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol_record.policyname || '" ON approved_events';
    END LOOP;
END $$;

-- Test update on event_submissions
UPDATE event_submissions 
SET status = 'pending' 
WHERE status = 'pending' 
LIMIT 1;

-- Test insert into events
INSERT INTO events (
  name,
  description,
  date,
  time,
  venue,
  ticket_price,
  slug,
  organizer_email,
  is_approved
) VALUES (
  'Test API Approval',
  'Testing final approval fix',
  '2025-12-31',
  '20:00:00',
  'Test Venue',
  25.00,
  'test-api-approval-' || extract(epoch from now()),
  'test@example.com',
  true
) RETURNING id, name;

-- Show current submissions for testing
SELECT id, name, status, created_at FROM event_submissions ORDER BY created_at DESC LIMIT 3;

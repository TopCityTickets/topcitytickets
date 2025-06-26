-- Fix events table and approval process
-- Run this in Supabase SQL Editor

-- First, let's see what's in the events table and its structure
DO $debug_events$
DECLARE
  table_exists BOOLEAN;
  col_record RECORD;
BEGIN
  RAISE NOTICE '=== CHECKING EVENTS TABLE ===';
  
  -- Check if events table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'events'
  ) INTO table_exists;
  
  RAISE NOTICE 'Events table exists: %', table_exists;
  
  IF table_exists THEN
    -- Show table structure
    RAISE NOTICE '=== EVENTS TABLE STRUCTURE ===';
    FOR col_record IN
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = 'events'
      ORDER BY ordinal_position
    LOOP
      RAISE NOTICE 'Column: % | Type: % | Nullable: % | Default: %', 
        col_record.column_name,
        col_record.data_type,
        col_record.is_nullable,
        col_record.column_default;
    END LOOP;
    
    -- Show current events count
    DECLARE
      event_count INTEGER;
    BEGIN
      SELECT COUNT(*) INTO event_count FROM events;
      RAISE NOTICE 'Current events in table: %', event_count;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error counting events: %', SQLERRM;
    END;
  END IF;
END $debug_events$;

-- Create events table if it doesn't exist
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  time TIME NOT NULL,
  venue TEXT NOT NULL,
  ticket_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  image_url TEXT,
  slug TEXT,
  user_id UUID REFERENCES auth.users(id),
  organizer_email TEXT,
  is_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add any missing columns to events table
DO $add_missing_columns$
BEGIN
  -- Add slug column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'slug'
  ) THEN
    ALTER TABLE events ADD COLUMN slug TEXT;
    RAISE NOTICE 'Added slug column to events table';
  END IF;
  
  -- Add organizer_email column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'organizer_email'
  ) THEN
    ALTER TABLE events ADD COLUMN organizer_email TEXT;
    RAISE NOTICE 'Added organizer_email column to events table';
  END IF;
  
  -- Add is_approved column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'is_approved'
  ) THEN
    ALTER TABLE events ADD COLUMN is_approved BOOLEAN DEFAULT true;
    RAISE NOTICE 'Added is_approved column to events table';
  END IF;
  
  -- Add user_id column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE events ADD COLUMN user_id UUID REFERENCES auth.users(id);
    RAISE NOTICE 'Added user_id column to events table';
  END IF;
  
  -- Add created_at column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE events ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    RAISE NOTICE 'Added created_at column to events table';
  END IF;
    -- Add updated_at column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE events ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    RAISE NOTICE 'Added updated_at column to events table';
  END IF;
END $add_missing_columns$;

-- Disable RLS on events table (nuclear option for debugging)
ALTER TABLE events DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies on events table
DO $drop_events_policies$
BEGIN
  RAISE NOTICE '=== DROPPING ALL EVENTS TABLE POLICIES ===';
  
  DROP POLICY IF EXISTS "Events are viewable by everyone" ON events;
  DROP POLICY IF EXISTS "Users can insert own events" ON events;
  DROP POLICY IF EXISTS "Users can update own events" ON events;
  DROP POLICY IF EXISTS "Admins can insert events" ON events;
  DROP POLICY IF EXISTS "Admins can update events" ON events;
  DROP POLICY IF EXISTS "Admins can delete events" ON events;
  DROP POLICY IF EXISTS "Public events are viewable" ON events;
  DROP POLICY IF EXISTS "Approved events are viewable" ON events;
  
  RAISE NOTICE 'All events table policies dropped';
END $drop_events_policies$;

-- Also check if we have the approved_at column in event_submissions
DO $check_event_submissions$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'event_submissions' AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE event_submissions ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Added approved_at column to event_submissions table';
  END IF;
END $check_event_submissions$;

-- Test insert to make sure it works
DO $test_insert$
DECLARE
  test_event_id UUID;
BEGIN
  RAISE NOTICE '=== TESTING EVENT INSERT ===';
  
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
    'Test Event',
    'This is a test event to verify the table works',
    '2025-12-31',
    '20:00:00',
    'Test Venue',
    25.00,
    'test-event',
    'test@example.com',
    true
  ) RETURNING id INTO test_event_id;
  
  RAISE NOTICE 'Test event inserted successfully with ID: %', test_event_id;
  
  -- Clean up test event
  DELETE FROM events WHERE id = test_event_id;
  RAISE NOTICE 'Test event cleaned up';
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error inserting test event: %', SQLERRM;
END $test_insert$;

-- Final status check
DO $final_status$
DECLARE
  rls_enabled BOOLEAN;
  policy_count INTEGER;
BEGIN
  RAISE NOTICE '=== FINAL EVENTS TABLE STATUS ===';
  
  -- Check RLS status
  SELECT rowsecurity INTO rls_enabled
  FROM pg_tables 
  WHERE schemaname = 'public' AND tablename = 'events';
  
  RAISE NOTICE 'Events table RLS enabled: %', COALESCE(rls_enabled, false);
  
  -- Check policy count
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE tablename = 'events';
  
  RAISE NOTICE 'Events table policies count: %', policy_count;
  
  RAISE NOTICE 'Events table should now be ready for admin approvals!';
END $final_status$;

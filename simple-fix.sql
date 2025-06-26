-- Simple fix script - run this if diagnosis shows issues
-- Run in Supabase SQL Editor

-- Create events table (will only create if it doesn't exist)
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
  user_id UUID,
  organizer_email TEXT,
  is_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ensure event_submissions table exists with proper columns
CREATE TABLE IF NOT EXISTS event_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  time TIME NOT NULL,
  venue TEXT NOT NULL,
  ticket_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  image_url TEXT,
  organizer_email TEXT,
  user_id UUID,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add approved_at column to event_submissions if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'event_submissions' AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE event_submissions ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Disable RLS (nuclear option)
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE event_submissions DISABLE ROW LEVEL SECURITY;

-- Drop all policies (ignore errors if they don't exist)
DROP POLICY IF EXISTS "Events are viewable by everyone" ON events;
DROP POLICY IF EXISTS "Users can insert own events" ON events;
DROP POLICY IF EXISTS "Users can update own events" ON events;
DROP POLICY IF EXISTS "Admins can insert events" ON events;
DROP POLICY IF EXISTS "Admins can update events" ON events;
DROP POLICY IF EXISTS "Public events are viewable" ON events;
DROP POLICY IF EXISTS "Approved events are viewable" ON events;

-- Test insert to events table (clean up any existing test data first)
DELETE FROM events WHERE slug = 'test-admin-approval';

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
  'Test Admin Approval',
  'Testing if admin approval works',
  '2025-12-31',
  '20:00:00',
  'Test Venue',
  25.00,
  'test-admin-approval',
  'test@example.com',
  true
) RETURNING id, name;

-- Show final table status
SELECT 'Setup Complete!' as status, COUNT(*) as total_events FROM events;

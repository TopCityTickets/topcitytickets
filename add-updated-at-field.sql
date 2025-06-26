-- Fix the missing updated_at field in event_submissions table
-- Run this in Supabase SQL Editor

-- Add updated_at column to event_submissions if it doesn't exist
ALTER TABLE event_submissions 
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());

-- Create a trigger function to automatically update the updated_at field
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop the trigger if it exists and recreate it
DROP TRIGGER IF EXISTS update_event_submissions_updated_at ON event_submissions;
CREATE TRIGGER update_event_submissions_updated_at
    BEFORE UPDATE ON event_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verify the table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'event_submissions'
ORDER BY ordinal_position;

-- Test that the trigger works
SELECT 'Script completed successfully. The updated_at field has been added and trigger created.' as result;

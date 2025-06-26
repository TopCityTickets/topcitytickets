-- Fix existing approved event submissions that are missing required fields
-- Run this in Supabase SQL Editor to update old approved events

-- First, let's see what we're working with
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
WHERE status = 'approved'
ORDER BY created_at DESC;

-- Update approved event submissions that are missing fields
UPDATE event_submissions 
SET 
  approved_at = COALESCE(approved_at, created_at),  -- Use created_at if approved_at is null
  admin_feedback = COALESCE(admin_feedback, 'Event approved and published'),  -- Set default feedback
  slug = COALESCE(slug, 
    LOWER(
      REGEXP_REPLACE(
        REGEXP_REPLACE(name, '[^a-zA-Z0-9 -]', '', 'g'),  -- Remove special chars
        '\s+', '-', 'g'  -- Replace spaces with hyphens
      )
    )
  )  -- Generate slug from name if missing
WHERE status = 'approved' 
  AND (approved_at IS NULL OR admin_feedback IS NULL OR slug IS NULL);

-- Verify the updates
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
WHERE status = 'approved'
ORDER BY created_at DESC;

-- Also check if these events exist in the main events table
SELECT 
  es.name as submission_name,
  es.slug as submission_slug,
  es.status,
  e.name as event_name,
  e.slug as event_slug,
  e.is_approved
FROM event_submissions es
LEFT JOIN events e ON e.name = es.name AND e.organizer_email = es.organizer_email
WHERE es.status = 'approved'
ORDER BY es.created_at DESC;

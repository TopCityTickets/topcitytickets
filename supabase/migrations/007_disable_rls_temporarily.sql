-- Diagnose and temporarily fix RLS policy issues for seller_applications

-- First, let's see what policies are currently active
DO $diagnose$
DECLARE
  policy_record RECORD;
BEGIN
  RAISE NOTICE 'Current RLS status and policies for seller_applications:';
  
  -- Check if RLS is enabled
  SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
  FROM pg_tables 
  WHERE tablename = 'seller_applications' AND schemaname = 'public'
  INTO policy_record;
  
  IF FOUND THEN
    RAISE NOTICE 'Table: %.% - RLS Enabled: %', 
      policy_record.schemaname, 
      policy_record.tablename, 
      policy_record.rowsecurity;
  END IF;
  
  -- List all policies
  FOR policy_record IN
    SELECT 
      policyname, 
      cmd,
      permissive,
      roles,
      qual,
      with_check
    FROM pg_policies 
    WHERE tablename = 'seller_applications'
    ORDER BY cmd, policyname
  LOOP
    RAISE NOTICE 'Policy: % | Command: % | Permissive: % | Roles: %', 
      policy_record.policyname, 
      policy_record.cmd,
      policy_record.permissive,
      policy_record.roles;
    RAISE NOTICE '  - USING clause: %', policy_record.qual;
    RAISE NOTICE '  - WITH CHECK clause: %', policy_record.with_check;
  END LOOP;
END $diagnose$;

-- Option 1: Temporarily disable RLS for testing
-- IMPORTANT: Only do this for testing, re-enable it after fixing the issue
ALTER TABLE seller_applications DISABLE ROW LEVEL SECURITY;

DO $disable_notice$
BEGIN
  RAISE NOTICE 'RLS has been DISABLED for seller_applications table for testing';
  RAISE NOTICE 'REMEMBER to re-enable RLS after testing: ALTER TABLE seller_applications ENABLE ROW LEVEL SECURITY;';
END $disable_notice$;

-- Alternative Option 2: Create a permissive policy for authenticated users
-- Uncomment these lines if you prefer to keep RLS enabled but make it more permissive:

-- DROP POLICY IF EXISTS "Authenticated users can insert applications" ON seller_applications;
-- CREATE POLICY "Authenticated users can insert applications"
-- ON seller_applications
-- FOR INSERT
-- TO authenticated
-- WITH CHECK (true);

-- RAISE NOTICE 'Created permissive policy for authenticated users';

-- Refresh schema cache
ANALYZE seller_applications;

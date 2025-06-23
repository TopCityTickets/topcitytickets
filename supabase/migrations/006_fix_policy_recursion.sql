-- Fix the infinite recursion in seller_applications policies

-- First, drop the problematic policy
DROP POLICY IF EXISTS "Users can create applications" ON seller_applications;

-- Create a safer version of the policy without recursion
CREATE POLICY "Users can create applications" 
ON seller_applications
FOR INSERT
WITH CHECK (
  -- User can only insert their own applications
  auth.uid() = user_id
  -- We'll handle the "only one pending application" check in the API instead
);

-- Alternative approach if needed: 
-- Use a direct SQL query approach rather than a policy constraint
-- DROP POLICY IF EXISTS "Users can create applications" ON seller_applications;
-- CREATE POLICY "Users can create applications" 
-- ON seller_applications
-- FOR INSERT
-- WITH CHECK (
--   auth.uid() = user_id
-- );

-- To help with debugging, let's log the active policies
DO $policy_debug$
DECLARE
  policy_record RECORD;
BEGIN
  RAISE NOTICE 'Current policies for seller_applications table:';
  FOR policy_record IN
    SELECT policyname, cmd 
    FROM pg_policies 
    WHERE tablename = 'seller_applications'
  LOOP
    RAISE NOTICE 'Policy: % (command: %)', policy_record.policyname, policy_record.cmd;
  END LOOP;
END $policy_debug$;

-- Refresh the schema cache
ANALYZE seller_applications;

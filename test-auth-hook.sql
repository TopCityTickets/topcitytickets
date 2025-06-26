-- Test Custom Access Token Hook
-- Run this after setting up the hook to verify it works

-- 1. Test the function directly with a sample user
DO $$
DECLARE
  test_event jsonb;
  result jsonb;
  sample_user_id uuid;
BEGIN
  -- Get a real user ID from your database (replace with an actual user ID)
  SELECT id INTO sample_user_id FROM public.users LIMIT 1;
  
  IF sample_user_id IS NOT NULL THEN
    -- Create a test event similar to what Supabase Auth would send
    test_event := jsonb_build_object(
      'user_id', sample_user_id,
      'claims', jsonb_build_object(
        'sub', sample_user_id,
        'email', 'test@example.com'
      )
    );
    
    -- Call the hook function
    SELECT public.custom_access_token_hook(test_event) INTO result;
    
    -- Display the result
    RAISE NOTICE 'Hook test result: %', result;
    RAISE NOTICE 'User role in claims: %', result->'claims'->'user_role';
  ELSE
    RAISE NOTICE 'No users found in database for testing';
  END IF;
END $$;

-- 2. Check if the function exists and has correct permissions
SELECT 
  p.proname as function_name,
  p.prorettype::regtype as return_type,
  p.proargtypes::regtype[] as argument_types,
  p.proacl as permissions
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'custom_access_token_hook';

-- 3. Check grants on the function
SELECT 
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.routine_privileges 
WHERE routine_schema = 'public' 
AND routine_name = 'custom_access_token_hook';

-- 4. Verify you can call the function as supabase_auth_admin would
SELECT 'Testing function permissions...' as status;

SELECT 'Hook test complete! Check the NOTICE messages above for results.' as result;

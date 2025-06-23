-- Quick debug: Check if RLS is actually disabled
SELECT 
  'Current RLS status:' as info,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';

-- Check if admin user exists and is accessible
SELECT 
  'Admin user check:' as test,
  COUNT(*) as user_count
FROM public.users 
WHERE email = 'topcitytickets@gmail.com';

-- Try to read the admin user directly
SELECT 
  'Direct user query:' as test,
  id,
  email,
  role,
  created_at
FROM public.users 
WHERE email = 'topcitytickets@gmail.com';

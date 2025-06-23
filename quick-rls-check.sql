-- Quick check: Is RLS actually disabled?
SELECT 
  'RLS Status Check:' as info,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';

-- Can we query the admin user?
SELECT 
  'Admin user accessible:' as test,
  id,
  email,
  role
FROM public.users 
WHERE email = 'topcitytickets@gmail.com';

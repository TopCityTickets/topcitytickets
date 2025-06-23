-- Disable RLS on users table permanently 
-- Since frontend access is limited and this fixes the auth issues

-- Step 1: Check current RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';

-- Step 2: Disable RLS on users table
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Step 3: Drop any existing RLS policies (they won't be needed)
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.users;

-- Step 4: Verify RLS is disabled
SELECT 
  'RLS Status After Disable:' as status,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';

-- Step 5: Test that the admin user can be queried
SELECT 
  'Admin user test:' as test,
  id,
  email,
  role,
  created_at
FROM public.users 
WHERE email = 'topcitytickets@gmail.com';

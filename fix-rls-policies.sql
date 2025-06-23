-- CHECK AND FIX RLS POLICIES FOR USERS TABLE

-- 1. Check current RLS status (fixed query)
SELECT 
  'RLS STATUS' as check_type,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';

-- 1b. Check RLS from pg_class (more detailed)
SELECT 
  'DETAILED RLS STATUS' as check_type,
  relname as table_name,
  relrowsecurity as rls_enabled,
  relforcerowsecurity as rls_forced
FROM pg_class 
WHERE relname = 'users' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 2. Check existing policies
SELECT 
  'EXISTING POLICIES' as check_type,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public';

-- 3. DISABLE RLS temporarily to test (we'll re-enable it properly later)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 4. Or create proper RLS policies that allow users to read their own data
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;

-- Create policy that allows users to read their own record
CREATE POLICY "Users can read own data" ON public.users
FOR SELECT USING (auth.uid() = id);

-- Create policy that allows users to update their own record
CREATE POLICY "Users can update own data" ON public.users
FOR UPDATE USING (auth.uid() = id);

-- 5. Test the fix by checking what the anon user can see
SELECT 
  'POLICY TEST' as check_type,
  'Run this after policies are created' as note;

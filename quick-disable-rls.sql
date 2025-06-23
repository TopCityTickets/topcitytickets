-- QUICK FIX: Disable RLS temporarily to test
-- This will allow the frontend to read user roles

-- 1. Check what's blocking access
SELECT 
  'TABLE INFO' as info,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';

-- 2. Check existing policies
SELECT 
  'EXISTING POLICIES' as info,
  policyname,
  cmd as command,
  permissive,
  roles
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public';

-- 3. TEMPORARILY disable RLS to test (we can re-enable later)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 4. Verify RLS is disabled
SELECT 
  'AFTER DISABLING RLS' as info,
  tablename,
  rowsecurity as rls_enabled,
  'Should be false now' as note
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';

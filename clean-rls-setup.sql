-- CLEAN SETUP OF RLS POLICIES
-- Drop existing policies and recreate them properly

-- 1. Drop all existing policies first
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.users;

-- 2. Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. Create clean policies

-- Policy 1: Users can read their own data
CREATE POLICY "Users can read own data" ON public.users
FOR SELECT USING (auth.uid() = id);

-- Policy 2: Users can update their own data  
CREATE POLICY "Users can update own data" ON public.users
FOR UPDATE USING (auth.uid() = id);

-- Policy 3: Allow INSERT for new user registration
CREATE POLICY "Users can insert own data" ON public.users
FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. Verify final setup
SELECT 
  'FINAL POLICIES' as info,
  policyname,
  cmd as command,
  permissive,
  roles
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public';

-- 5. Verify RLS is enabled
SELECT 
  'RLS STATUS' as info,
  tablename,
  rowsecurity as rls_enabled,
  'Should be true' as note
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';

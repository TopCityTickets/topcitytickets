-- RE-ENABLE RLS WITH PROPER POLICIES
-- This will secure the users table while allowing proper access

-- 1. Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Create proper policies

-- Policy 1: Users can read their own data
CREATE POLICY "Users can read own data" ON public.users
FOR SELECT USING (auth.uid() = id);

-- Policy 2: Users can update their own data  
CREATE POLICY "Users can update own data" ON public.users
FOR UPDATE USING (auth.uid() = id);

-- Policy 3: Allow INSERT for new user registration (when auth.uid() matches)
CREATE POLICY "Users can insert own data" ON public.users
FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. Verify policies are created
SELECT 
  'FINAL POLICIES' as info,
  policyname,
  cmd as command,
  permissive,
  roles
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public';

-- 5. Test that RLS is working properly
SELECT 
  'RLS STATUS AFTER SETUP' as info,
  tablename,
  rowsecurity as rls_enabled,
  'Should be true with proper policies' as note
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';

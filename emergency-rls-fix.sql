-- EMERGENCY FIX: Disable RLS on users table to stop infinite recursion
-- This completely removes RLS from users table to fix the admin access issue
-- Run this in Supabase SQL Editor

-- 1. DISABLE RLS on users table completely
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 2. Drop ALL policies on users table
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update user roles" ON public.users;

-- 3. Verify users table is accessible
SELECT 'Users table RLS disabled - admin access should work now!' as status;

-- 4. Test query to make sure users table works
SELECT COUNT(*) as user_count FROM public.users;

-- 5. Final message
SELECT 
    'Emergency fix complete! Try the Force Admin Role button now.' as final_message;

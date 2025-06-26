-- COMPREHENSIVE AUTH FIX - Stop infinite loops and access issues
-- Run this in Supabase SQL Editor

-- 1. Disable all problematic triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.assign_user_role(uuid, text);

-- 2. Temporarily disable RLS on problematic tables
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- 3. Check current state
SELECT 'Current users table:' as info;
SELECT id, email, role FROM public.users WHERE id = '3f6cbcf7-afbf-4f95-b854-13b2d4478f7b' OR email LIKE '%topcitytickets%';

SELECT 'Current user_roles table:' as info;
SELECT user_id, role FROM public.user_roles WHERE user_id = '3f6cbcf7-afbf-4f95-b854-13b2d4478f7b';

-- 4. Clean up and set proper admin role for your user
DELETE FROM public.user_roles WHERE user_id = '3f6cbcf7-afbf-4f95-b854-13b2d4478f7b';
DELETE FROM public.users WHERE id = '3f6cbcf7-afbf-4f95-b854-13b2d4478f7b';

-- Insert your user as admin
INSERT INTO public.users (id, email, role, created_at)
VALUES ('3f6cbcf7-afbf-4f95-b854-13b2d4478f7b', 'admin@topcitytickets.com', 'admin', now());

INSERT INTO public.user_roles (user_id, role) 
VALUES ('3f6cbcf7-afbf-4f95-b854-13b2d4478f7b', 'admin');

-- 5. Create simple, non-recursive RLS policies
DROP POLICY IF EXISTS "Users can read their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own applications" ON public.seller_applications;
DROP POLICY IF EXISTS "Users can create applications" ON public.seller_applications;
DROP POLICY IF EXISTS "Admins can manage all applications" ON public.seller_applications;

-- Simple policies that won't cause recursion
CREATE POLICY "Allow all authenticated reads" ON public.user_roles
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read users" ON public.users
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow all authenticated access to seller_applications" ON public.seller_applications
FOR ALL TO authenticated USING (true);

-- 6. Re-enable RLS with simple policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 7. Verify the setup
SELECT 'Final verification:' as info;
SELECT 
  u.id,
  u.email,
  u.role as users_table_role,
  ur.role as user_roles_table_role
FROM public.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.id = '3f6cbcf7-afbf-4f95-b854-13b2d4478f7b';

SELECT 'Auth fix complete! Try refreshing your browser now.' as result;

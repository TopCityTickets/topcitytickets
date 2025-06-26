-- SIMPLE ADMIN FIX - Just set your current user as admin
-- Run this in Supabase SQL Editor

-- 1. Disable any problematic triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Check what users exist
SELECT 
  id,
  email,
  role
FROM public.users 
WHERE email = 'topcitytickets@gmail.com' OR id = '3f6cbcf7-afbf-4f95-b854-13b2d4478f7b'
ORDER BY email;

-- 3. Simple approach: Just make your current logged-in user admin
-- This creates a new user record with your current ID if it doesn't exist
INSERT INTO public.users (id, email, role, created_at)
VALUES ('3f6cbcf7-afbf-4f95-b854-13b2d4478f7b', 'admin@topcitytickets.com', 'admin', now())
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- 4. Set admin role in RBAC table
DELETE FROM public.user_roles WHERE user_id = '3f6cbcf7-afbf-4f95-b854-13b2d4478f7b';
INSERT INTO public.user_roles (user_id, role) 
VALUES ('3f6cbcf7-afbf-4f95-b854-13b2d4478f7b', 'admin');

-- 5. Verify the result
SELECT 
  u.id,
  u.email,
  u.role as users_table_role,
  ur.role as user_roles_table_role
FROM public.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.id = '3f6cbcf7-afbf-4f95-b854-13b2d4478f7b';

SELECT 'Simple admin fix complete! You should now have admin access.' as result;

-- EMERGENCY FIX - Restore Sign-in Functionality
-- Run this immediately in Supabase SQL Editor

-- 1. Disable the problematic trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Drop the function that might be causing issues
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. Check if your admin user still exists and is correct
SELECT 
  id,
  email,
  role as current_role
FROM public.users 
WHERE email = 'topcitytickets@gmail.com' OR id = '3f6cbcf7-afbf-4f95-b854-13b2d4478f7b'
ORDER BY email;

-- 4. Make sure you still have admin access
SELECT 
  u.email,
  u.role as users_table_role,
  ur.role as user_roles_table_role
FROM public.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'topcitytickets@gmail.com' OR u.id = '3f6cbcf7-afbf-4f95-b854-13b2d4478f7b';

-- 5. Fix the user role assignment properly
-- First, check what user records exist
SELECT 
  id,
  email,
  role
FROM public.users 
WHERE email = 'topcitytickets@gmail.com' OR id = '3f6cbcf7-afbf-4f95-b854-13b2d4478f7b';

-- Update the existing user with your email to admin role
UPDATE public.users 
SET role = 'admin'
WHERE email = 'topcitytickets@gmail.com';

-- If your current user ID doesn't exist in users table, create it
INSERT INTO public.users (id, email, role, created_at)
VALUES ('3f6cbcf7-afbf-4f95-b854-13b2d4478f7b', 'topcitytickets@gmail.com', 'admin', now())
ON CONFLICT (email) DO UPDATE SET 
  id = EXCLUDED.id,
  role = 'admin';

-- Alternative: If the above fails, just update your current user ID to admin
INSERT INTO public.users (id, email, role, created_at)
SELECT '3f6cbcf7-afbf-4f95-b854-13b2d4478f7b', 
       'topcitytickets-' || substring('3f6cbcf7-afbf-4f95-b854-13b2d4478f7b', 1, 8) || '@gmail.com',
       'admin', 
       now()
WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE id = '3f6cbcf7-afbf-4f95-b854-13b2d4478f7b')
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- 6. Ensure you have admin role in user_roles table for current user:
DELETE FROM public.user_roles WHERE user_id = '3f6cbcf7-afbf-4f95-b854-13b2d4478f7b';
INSERT INTO public.user_roles (user_id, role) 
VALUES ('3f6cbcf7-afbf-4f95-b854-13b2d4478f7b', 'admin');

SELECT 'Emergency fix applied - trigger disabled!' as result;
SELECT 'Try signing in now. If it still fails, run the commented sections above.' as instruction;

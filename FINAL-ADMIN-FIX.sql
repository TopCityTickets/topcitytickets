-- FINAL ADMIN FIX - Run this in Supabase SQL Editor
-- This will ensure topcitytickets@gmail.com is properly set as admin

-- 1. Check current state
SELECT 'Current state check:' as action;
SELECT id, email, role, created_at 
FROM public.users 
WHERE email = 'topcitytickets@gmail.com';

-- 2. Ensure admin user exists in public.users table
INSERT INTO public.users (id, email, role, created_at, updated_at)
VALUES (
  '3f6cbcf7-afbf-4f95-b854-13b2d4478f7b',
  'topcitytickets@gmail.com', 
  'admin',
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE SET 
  role = 'admin',
  updated_at = now();

-- 3. Also ensure it exists in user_roles table for compatibility
INSERT INTO public.user_roles (user_id, role, created_at)
VALUES (
  '3f6cbcf7-afbf-4f95-b854-13b2d4478f7b',
  'admin',
  now()
)
ON CONFLICT (user_id) DO UPDATE SET 
  role = 'admin';

-- 4. Verify the fix
SELECT 'Verification:' as action;
SELECT u.id, u.email, u.role as users_role, ur.role as user_roles_role
FROM public.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'topcitytickets@gmail.com';

SELECT 'Admin setup complete!' as result;

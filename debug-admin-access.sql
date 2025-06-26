-- Debug Admin Access - Supabase Compatible
-- Run this in Supabase SQL Editor to check admin status

-- 1. Check your current user ID and role in users table
SELECT 
  id,
  email,
  role,
  created_at
FROM public.users
WHERE email = 'YOUR_EMAIL_HERE'  -- Replace with your actual email
LIMIT 1;

-- 2. Check your role in the new RBAC system
SELECT 
  ur.id,
  ur.user_id,
  ur.role,
  u.email
FROM public.user_roles ur
LEFT JOIN public.users u ON ur.user_id = u.id
WHERE u.email = 'YOUR_EMAIL_HERE'  -- Replace with your actual email
LIMIT 1;

-- 3. Check all admin users
SELECT 
  u.id,
  u.email,
  u.role as legacy_role,
  ur.role as rbac_role
FROM public.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.role = 'admin' OR ur.role = 'admin'
ORDER BY u.created_at;

-- 4. If you need to make yourself admin, use these (replace YOUR_EMAIL_HERE and YOUR_USER_ID_HERE):
-- For RBAC system (TEXT type):
-- INSERT INTO public.user_roles (user_id, role) 
-- VALUES ('YOUR_USER_ID_HERE', 'admin');

-- For legacy system:
-- UPDATE public.users 
-- SET role = 'admin' 
-- WHERE email = 'YOUR_EMAIL_HERE';

SELECT 'Admin debug check complete!' as result;

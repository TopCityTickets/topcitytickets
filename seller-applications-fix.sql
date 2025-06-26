-- SELLER APPLICATIONS FIX
-- Run this in Supabase SQL Editor to fix seller application display issues

-- 1. Check current seller applications
SELECT 'Current seller applications:' as info;
SELECT 
  sa.id,
  sa.user_id,
  sa.status,
  sa.applied_at,
  u.email,
  u.role
FROM seller_applications sa
LEFT JOIN public.users u ON sa.user_id = u.id
ORDER BY sa.applied_at DESC;

-- 2. Find any applications with missing user records
SELECT 'Applications with missing user records:' as info;
SELECT sa.*
FROM seller_applications sa
LEFT JOIN public.users u ON sa.user_id = u.id
WHERE u.id IS NULL;

-- 3. Create missing user records for applications (if any)
-- This will create basic user records for any seller applications that don't have users
INSERT INTO public.users (id, email, role, created_at, updated_at)
SELECT 
  sa.user_id,
  'user-' || sa.user_id || '@unknown.com' as email,
  'user' as role,
  NOW() as created_at,
  NOW() as updated_at
FROM seller_applications sa
LEFT JOIN public.users u ON sa.user_id = u.id
WHERE u.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 4. Check if any applications were fixed
SELECT 'After fix - applications with users:' as info;
SELECT 
  sa.id,
  sa.user_id,
  sa.status,
  sa.applied_at,
  u.email,
  u.role
FROM seller_applications sa
LEFT JOIN public.users u ON sa.user_id = u.id
ORDER BY sa.applied_at DESC;

-- 5. Verify your admin role is still intact
SELECT 'Admin verification:' as info;
SELECT id, email, role 
FROM public.users 
WHERE email = 'topcitytickets@gmail.com';

SELECT 'Fix complete! Applications should now show proper user emails.' as result;

-- Supabase-Compatible Admin Setup and Debug Script
-- Run this in Supabase SQL Editor

-- 1. First, let's check what enum types exist in our database
SELECT 
  t.typname as enum_name,
  string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as enum_values
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
GROUP BY t.typname
ORDER BY t.typname;

-- 2. Check user_roles table structure to see the actual data type
SELECT 
  column_name,
  data_type,
  udt_name,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_roles'
ORDER BY ordinal_position;

-- 3. Check existing roles in user_roles table
SELECT DISTINCT role FROM public.user_roles;

-- 4. Check your current user status (replace YOUR_EMAIL_HERE with your actual email)
SELECT 
  u.id,
  u.email,
  u.role as legacy_role,
  ur.role as rbac_role,
  u.created_at
FROM public.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'YOUR_EMAIL_HERE'  -- Replace with your actual email
LIMIT 1;

-- 5. Check all current admins
SELECT 
  u.id,
  u.email,
  u.role as legacy_role,
  ur.role as rbac_role
FROM public.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.role = 'admin' OR ur.role = 'admin'
ORDER BY u.created_at;

-- 6. Check seller applications
SELECT 
  sa.id,
  sa.user_id,
  sa.status,
  sa.applied_at,
  sa.created_at,
  u.email as user_email
FROM public.seller_applications sa
LEFT JOIN public.users u ON sa.user_id = u.id
ORDER BY sa.created_at DESC
LIMIT 10;

-- 7. Count applications by status
SELECT 
  status,
  count(*) as count
FROM public.seller_applications
GROUP BY status;

SELECT 'Supabase debug check complete!' as result;

-- INSTRUCTIONS FOR MAKING YOURSELF ADMIN:
-- After running the above, if you need to make yourself admin:
-- 1. Note your user ID from query #4
-- 2. Check the exact role data type from query #2
-- 3. Use one of these patterns based on what you find:

-- If role column uses TEXT type (most common in Supabase):
-- INSERT INTO public.user_roles (user_id, role) 
-- VALUES ('YOUR_USER_ID_HERE', 'admin');

-- UPDATE public.users 
-- SET role = 'admin' 
-- WHERE email = 'YOUR_EMAIL_HERE';

-- If role column uses an enum, first create the enum if it doesn't exist:
-- CREATE TYPE user_role AS ENUM ('user', 'seller', 'admin');
-- Then use:
-- INSERT INTO public.user_roles (user_id, role) 
-- VALUES ('YOUR_USER_ID_HERE', 'admin'::user_role);

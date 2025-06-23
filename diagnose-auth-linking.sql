-- Check if admin user exists in auth.users table
SELECT 
  'auth.users' as table_name,
  id,
  email,
  created_at,
  email_confirmed_at,
  encrypted_password IS NOT NULL as has_password
FROM auth.users 
WHERE email = 'topcitytickets@gmail.com'

UNION ALL

-- Check if admin user exists in public.users table  
SELECT 
  'public.users' as table_name,
  id::text,
  email,
  created_at,
  updated_at,
  role
FROM public.users 
WHERE email = 'topcitytickets@gmail.com';

-- Check for any ID mismatches
SELECT 
  au.id as auth_id,
  pu.id as public_id,
  au.email as auth_email,
  pu.email as public_email,
  pu.role
FROM auth.users au
FULL OUTER JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'topcitytickets@gmail.com' 
   OR pu.email = 'topcitytickets@gmail.com';

-- Count total records for each table
SELECT 
  'Total auth.users' as description,
  COUNT(*) as count
FROM auth.users

UNION ALL

SELECT 
  'Total public.users' as description,
  COUNT(*) as count
FROM public.users;

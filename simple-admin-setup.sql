-- SIMPLE ADMIN SETUP - Run this in Supabase SQL Editor
-- Step 1: Find your user ID first
SELECT 
  'Your current user info:' as info,
  au.id as user_id,
  au.email,
  pu.role as current_role
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'topcitytickets@gmail.com';

-- Step 2: Delete any existing user record
DELETE FROM public.users 
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'topcitytickets@gmail.com'
);

-- Step 3: Create admin user record
INSERT INTO public.users (id, email, role, created_at, updated_at)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'topcitytickets@gmail.com'),
  'topcitytickets@gmail.com',
  'admin',
  NOW(),
  NOW()
);

-- Step 4: Verify it worked
SELECT 
  'After admin setup:' as info,
  au.id as user_id,
  au.email,
  pu.role as new_role,
  pu.created_at,
  pu.updated_at
FROM auth.users au
JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'topcitytickets@gmail.com';

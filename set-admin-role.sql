-- Set topcitytickets@gmail.com as admin
-- Run this in Supabase SQL Editor

-- First, find the user ID
SELECT 
  au.id,
  au.email,
  pu.role,
  pu.created_at,
  pu.updated_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'topcitytickets@gmail.com';

-- If the user doesn't exist in public.users table, insert them
INSERT INTO public.users (id, email, role, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  'admin',
  NOW(),
  NOW()
FROM auth.users au
WHERE au.email = 'topcitytickets@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.users pu WHERE pu.id = au.id
  );

-- Update existing user to admin role
UPDATE public.users 
SET role = 'admin', updated_at = NOW()
FROM auth.users au
WHERE public.users.id = au.id 
  AND au.email = 'topcitytickets@gmail.com';

-- Verify the update
SELECT 
  au.id,
  au.email,
  pu.role,
  pu.created_at,
  pu.updated_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'topcitytickets@gmail.com';

-- DIRECT SQL SCRIPT TO SET ADMIN ROLE
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql

-- Step 1: Check current state
SELECT 
  'BEFORE UPDATE' as status,
  au.id,
  au.email,
  pu.role,
  pu.created_at as user_created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'topcitytickets@gmail.com';

-- Step 2: Delete any existing records for this user (cleanup)
DELETE FROM public.users 
WHERE id IN (
  SELECT au.id 
  FROM auth.users au 
  WHERE au.email = 'topcitytickets@gmail.com'
);

-- Step 3: Insert fresh admin record
INSERT INTO public.users (id, email, role, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  'admin' as role,
  NOW() as created_at,
  NOW() as updated_at
FROM auth.users au
WHERE au.email = 'topcitytickets@gmail.com';

-- Step 4: Verify the result
SELECT 
  'AFTER UPDATE' as status,
  au.id,
  au.email,
  pu.role,
  pu.created_at as user_created_at,
  pu.updated_at as user_updated_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'topcitytickets@gmail.com';

-- Step 5: Double check - list all admin users
SELECT 
  'ALL ADMINS' as status,
  au.email,
  pu.role,
  pu.created_at
FROM auth.users au
JOIN public.users pu ON au.id = pu.id
WHERE pu.role = 'admin';

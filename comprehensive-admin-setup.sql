-- COMPREHENSIVE ADMIN SETUP - Run this in Supabase SQL Editor
-- This will show you everything and fix any issues

-- Step 1: Check if the user exists in auth.users
SELECT 
  '=== STEP 1: Check auth.users ===' as step,
  id,
  email,
  created_at
FROM auth.users 
WHERE email = 'topcitytickets@gmail.com';

-- Step 2: Check current public.users table
SELECT 
  '=== STEP 2: Check public.users ===' as step,
  id,
  email,
  role,
  created_at,
  updated_at
FROM public.users 
WHERE email = 'topcitytickets@gmail.com'
   OR id = (SELECT id FROM auth.users WHERE email = 'topcitytickets@gmail.com');

-- Step 3: Delete ALL existing records for this user (by both email and ID)
DELETE FROM public.users 
WHERE email = 'topcitytickets@gmail.com';

DELETE FROM public.users 
WHERE id = (SELECT id FROM auth.users WHERE email = 'topcitytickets@gmail.com');

-- Step 4: Insert fresh admin record with explicit values
DO $$
DECLARE
    user_uuid UUID;
BEGIN
    -- Get the user ID from auth.users
    SELECT id INTO user_uuid FROM auth.users WHERE email = 'topcitytickets@gmail.com';
    
    -- Insert the admin record
    INSERT INTO public.users (id, email, role, created_at, updated_at)
    VALUES (user_uuid, 'topcitytickets@gmail.com', 'admin', NOW(), NOW());
    
    RAISE NOTICE 'Admin user created with ID: %', user_uuid;
END $$;

-- Step 5: Verify the final result
SELECT 
  '=== STEP 5: Final verification ===' as step,
  au.id as auth_id,
  au.email as auth_email,
  pu.id as public_id,
  pu.email as public_email,
  pu.role,
  pu.created_at,
  pu.updated_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'topcitytickets@gmail.com';

-- Step 6: Show all admin users to confirm
SELECT 
  '=== STEP 6: All admin users ===' as step,
  au.email,
  pu.role,
  pu.created_at
FROM auth.users au
JOIN public.users pu ON au.id = pu.id
WHERE pu.role = 'admin';

-- DIAGNOSTIC: Check for ID mismatches and multiple records
-- This will show us exactly what's wrong

-- Step 1: Show your auth.users record with full details
SELECT 
  '=== AUTH.USERS RECORD ===' as info,
  id as auth_id,
  email,
  created_at,
  LENGTH(id::text) as id_length,
  id::text as id_as_text
FROM auth.users 
WHERE email = 'topcitytickets@gmail.com';

-- Step 2: Show ALL public.users records (to see if there are duplicates)
SELECT 
  '=== ALL PUBLIC.USERS RECORDS ===' as info,
  id as public_id,
  email,
  role,
  created_at,
  LENGTH(id::text) as id_length,
  id::text as id_as_text,
  ROW_NUMBER() OVER (ORDER BY created_at) as record_number
FROM public.users 
WHERE email = 'topcitytickets@gmail.com';

-- Step 3: Check for ID mismatches between auth and public tables
SELECT 
  '=== ID COMPARISON ===' as info,
  au.id as auth_id,
  pu.id as public_id,
  CASE 
    WHEN au.id = pu.id THEN 'IDs MATCH ✓'
    ELSE 'IDs DO NOT MATCH ✗'
  END as id_match_status,
  au.email as auth_email,
  pu.email as public_email,
  pu.role
FROM auth.users au
FULL OUTER JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'topcitytickets@gmail.com' 
   OR pu.email = 'topcitytickets@gmail.com';

-- Step 4: Show what a simple SELECT query returns (what the app sees)
SELECT 
  '=== WHAT APP SEES (simple query) ===' as info,
  id,
  email,
  role,
  'This is what .single() returns' as note
FROM public.users 
WHERE email = 'topcitytickets@gmail.com'
LIMIT 1;

-- Step 5: Show what the app sees when querying by ID from auth
SELECT 
  '=== WHAT APP SEES (by auth ID) ===' as info,
  pu.id,
  pu.email,
  pu.role,
  'This is what the navbar query should return' as note
FROM public.users pu
WHERE pu.id = (SELECT id FROM auth.users WHERE email = 'topcitytickets@gmail.com');

-- Step 6: Clean up and create ONE perfect record
-- First delete everything
DELETE FROM public.users 
WHERE email = 'topcitytickets@gmail.com';

-- Now insert ONE record with the exact auth.users ID
INSERT INTO public.users (id, email, role, created_at, updated_at)
SELECT 
  id,  -- Use the exact ID from auth.users
  email,
  'admin' as role,
  NOW(),
  NOW()
FROM auth.users 
WHERE email = 'topcitytickets@gmail.com';

-- Step 7: Final verification
SELECT 
  '=== FINAL VERIFICATION ===' as info,
  au.id as auth_id,
  pu.id as public_id,
  CASE 
    WHEN au.id = pu.id THEN 'PERFECT MATCH ✓'
    ELSE 'STILL BROKEN ✗'
  END as status,
  pu.role,
  'Should show PERFECT MATCH and admin role' as note
FROM auth.users au
JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'topcitytickets@gmail.com';

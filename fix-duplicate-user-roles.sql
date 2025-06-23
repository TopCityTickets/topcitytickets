-- CHECK FOR DUPLICATE USER RECORDS
-- This will show if you have multiple records with different roles

-- Step 1: Find ALL records for your email/ID (including duplicates)
SELECT 
  '=== ALL RECORDS FOR YOUR USER ===' as info,
  pu.id,
  pu.email,
  pu.role,
  pu.created_at,
  pu.updated_at,
  'Record #' || ROW_NUMBER() OVER (ORDER BY pu.created_at) as record_number
FROM public.users pu
WHERE pu.email = 'topcitytickets@gmail.com'
   OR pu.id = (SELECT id FROM auth.users WHERE email = 'topcitytickets@gmail.com')
ORDER BY pu.created_at;

-- Step 2: Check which record the database returns FIRST (this is what the app sees)
SELECT 
  '=== FIRST RECORD (what app sees) ===' as info,
  role,
  created_at,
  'This is the role your app will use' as note
FROM public.users 
WHERE email = 'topcitytickets@gmail.com'
   OR id = (SELECT id FROM auth.users WHERE email = 'topcitytickets@gmail.com')
ORDER BY created_at
LIMIT 1;

-- Step 3: DELETE ALL records for this user
DELETE FROM public.users 
WHERE email = 'topcitytickets@gmail.com'
   OR id = (SELECT id FROM auth.users WHERE email = 'topcitytickets@gmail.com');

-- Step 4: Create ONE clean admin record
INSERT INTO public.users (id, email, role, created_at, updated_at)
SELECT 
  au.id,
  'topcitytickets@gmail.com',
  'admin',
  NOW(),
  NOW()
FROM auth.users au
WHERE au.email = 'topcitytickets@gmail.com';

-- Step 5: Verify there's now only ONE record with admin role
SELECT 
  '=== FINAL CLEAN RESULT ===' as info,
  COUNT(*) as total_records,
  role,
  'Should be 1 record with admin role' as note
FROM public.users 
WHERE email = 'topcitytickets@gmail.com'
   OR id = (SELECT id FROM auth.users WHERE email = 'topcitytickets@gmail.com')
GROUP BY role;

-- Quick and simple delete - just the essentials
-- This should work now with correct column names

-- Step 1: Check what we're deleting
SELECT 
  'Before deletion:' as status,
  (SELECT COUNT(*) FROM auth.users WHERE email = 'topcitytickets@gmail.com') as auth_count,
  (SELECT COUNT(*) FROM public.users WHERE email = 'topcitytickets@gmail.com') as public_count;

-- Step 2: Delete from public tables first (foreign key order)
DELETE FROM public.events WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'topcitytickets@gmail.com'
);

DELETE FROM public.users WHERE email = 'topcitytickets@gmail.com';

-- Step 3: Delete from auth.users last
DELETE FROM auth.users WHERE email = 'topcitytickets@gmail.com';

-- Step 4: Verify deletion
SELECT 
  'After deletion:' as status,
  (SELECT COUNT(*) FROM auth.users WHERE email = 'topcitytickets@gmail.com') as auth_count,
  (SELECT COUNT(*) FROM public.users WHERE email = 'topcitytickets@gmail.com') as public_count;

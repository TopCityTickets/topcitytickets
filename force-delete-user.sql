-- Force delete admin user by bypassing constraints
-- Use this if the safe method doesn't work

-- Step 1: Temporarily disable triggers and constraints
SET session_replication_role = replica;

-- Step 2: Force delete from public.users
DELETE FROM public.users WHERE email = 'topcitytickets@gmail.com';

-- Step 3: Force delete from auth.users  
DELETE FROM auth.users WHERE email = 'topcitytickets@gmail.com';

-- Step 4: Re-enable triggers and constraints
SET session_replication_role = DEFAULT;

-- Step 5: Verify deletion
SELECT 
  'Verification:' as status,
  (SELECT COUNT(*) FROM public.users WHERE email = 'topcitytickets@gmail.com') as public_count,
  (SELECT COUNT(*) FROM auth.users WHERE email = 'topcitytickets@gmail.com') as auth_count;

-- If both counts are 0, deletion was successful

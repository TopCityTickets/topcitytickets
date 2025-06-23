-- Step-by-step user deletion that handles constraints
-- Run these one by one to safely delete the admin user

-- Step 1: Check what's preventing deletion
SELECT 
  'Checking dependencies...' as step,
  (SELECT COUNT(*) FROM public.users WHERE email = 'topcitytickets@gmail.com') as public_users_count,
  (SELECT COUNT(*) FROM auth.users WHERE email = 'topcitytickets@gmail.com') as auth_users_count;

-- Step 2: Check for any related records that might block deletion
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE column_name IN ('user_id', 'created_by', 'owner_id') 
  AND table_schema = 'public';

-- Step 3: Get the user ID first
SELECT id FROM auth.users WHERE email = 'topcitytickets@gmail.com';

-- Step 4: Check for any records in other tables (replace USER_ID_HERE with actual ID)
-- SELECT COUNT(*) FROM events WHERE created_by = 'USER_ID_HERE';
-- SELECT COUNT(*) FROM tickets WHERE user_id = 'USER_ID_HERE';

-- Step 5: Delete in correct order (uncomment after checking)

-- Delete from public.users first
-- DELETE FROM public.users WHERE email = 'topcitytickets@gmail.com';

-- Then delete from auth.users
-- DELETE FROM auth.users WHERE email = 'topcitytickets@gmail.com';

-- Alternative: Just clear the confirmation without deleting
UPDATE auth.users 
SET 
  confirmation_token = NULL,
  email_confirmed_at = NOW(),
  updated_at = NOW()
WHERE email = 'topcitytickets@gmail.com';

-- Verify the update worked
SELECT 
  email,
  email_confirmed_at IS NOT NULL as is_confirmed,
  confirmation_token IS NULL as token_cleared,
  updated_at
FROM auth.users 
WHERE email = 'topcitytickets@gmail.com';

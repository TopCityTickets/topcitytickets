-- Nuclear option: Delete the user by any means necessary
-- This handles all possible constraints and foreign keys

-- Step 1: Find the user ID first
SELECT 
  'Target for deletion:' as info,
  id,
  email,
  created_at
FROM auth.users 
WHERE email = 'topcitytickets@gmail.com';

-- Step 2: Check what tables might have foreign key references
SELECT 
  kcu.table_name,
  kcu.column_name,
  kcu.constraint_name
FROM information_schema.key_column_usage kcu
JOIN information_schema.table_constraints tc 
  ON kcu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND kcu.table_schema = 'public'
  AND (kcu.column_name LIKE '%user_id%' OR kcu.column_name = 'id');

-- Step 3: Delete from all possible related tables first
-- (Using correct column names)

-- Delete events created by this user
DELETE FROM public.events WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'topcitytickets@gmail.com'
);

-- Delete any tickets
DELETE FROM public.tickets WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'topcitytickets@gmail.com'
);

-- Delete any seller applications  
DELETE FROM public.seller_applications WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'topcitytickets@gmail.com'
);

-- Step 4: Now delete from public.users
DELETE FROM public.users WHERE email = 'topcitytickets@gmail.com';

-- Step 5: Finally delete from auth.users
DELETE FROM auth.users WHERE email = 'topcitytickets@gmail.com';

-- Step 6: Verify complete deletion
SELECT 
  'Deletion verification:' as status,
  (SELECT COUNT(*) FROM auth.users WHERE email = 'topcitytickets@gmail.com') as auth_count,
  (SELECT COUNT(*) FROM public.users WHERE email = 'topcitytickets@gmail.com') as public_count,  (SELECT COUNT(*) FROM public.events WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'topcitytickets@gmail.com'
  )) as events_count;

-- If all counts are 0, deletion was successful!

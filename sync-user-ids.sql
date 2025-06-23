-- Fix ID mismatch between auth.users and public.users
-- This will make the public.users ID match the auth.users ID

-- Step 1: Check current IDs
SELECT 
  'Current IDs:' as info,
  au.id as auth_id,
  pu.id as public_id,
  au.email as auth_email,
  pu.email as public_email,
  pu.role
FROM auth.users au
FULL OUTER JOIN public.users pu ON pu.email = au.email
WHERE au.email = 'topcitytickets@gmail.com' OR pu.email = 'topcitytickets@gmail.com';

-- Step 2: Get the auth.users ID (this is the correct one to use)
SELECT 
  'Auth ID to use:' as info,
  id as correct_id,
  email
FROM auth.users 
WHERE email = 'topcitytickets@gmail.com';

-- Step 3: Update the public.users record to match auth.users ID
-- First, let's see what we're working with
SELECT id, email, role FROM public.users WHERE email = 'topcitytickets@gmail.com';

-- Step 4: Delete the old public.users record and insert with correct ID
DELETE FROM public.users WHERE email = 'topcitytickets@gmail.com';

-- Step 5: Insert new record with matching ID from auth.users
INSERT INTO public.users (id, email, role)
SELECT 
  au.id,
  au.email,
  'admin'
FROM auth.users au
WHERE au.email = 'topcitytickets@gmail.com';

-- Step 6: Verify the IDs now match
SELECT 
  'After sync:' as status,
  au.id as auth_id,
  pu.id as public_id,
  au.id = pu.id as ids_match,
  pu.role
FROM auth.users au
JOIN public.users pu ON pu.id = au.id
WHERE au.email = 'topcitytickets@gmail.com';

-- Step 7: Also confirm the email while we're at it
UPDATE auth.users 
SET 
  email_confirmed_at = NOW(),
  confirmation_token = '',
  updated_at = NOW()
WHERE email = 'topcitytickets@gmail.com';

-- Final verification - everything should be ready for login
SELECT 
  'Ready for login:' as status,
  au.email,
  au.email_confirmed_at IS NOT NULL as email_confirmed,
  pu.role,
  au.id = pu.id as ids_synced
FROM auth.users au
JOIN public.users pu ON pu.id = au.id
WHERE au.email = 'topcitytickets@gmail.com';

-- This script creates a proper admin user in both auth.users and public.users tables
-- Only run this if the diagnosis shows the user doesn't exist in auth.users

-- Step 1: Insert into auth.users (this will trigger the handle_new_user function)
-- Note: You'll need to set a password hash. This is a placeholder approach.
-- Better to use Supabase's admin API or have the user sign up normally.

/*
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'topcitytickets@gmail.com',
  crypt('YourPasswordHere', gen_salt('bf')), -- Replace with actual password
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);
*/

-- Alternative: If the user already exists in public.users but not in auth.users,
-- you need to either:

-- 1. Delete the existing public.users record and have them sign up fresh:
-- DELETE FROM public.users WHERE email = 'topcitytickets@gmail.com';

-- 2. Or enable "Allow manual linking" in Supabase Auth settings

-- Check current state first:
SELECT 
  'Current state check:' as info,
  (SELECT COUNT(*) FROM auth.users WHERE email = 'topcitytickets@gmail.com') as auth_count,
  (SELECT COUNT(*) FROM public.users WHERE email = 'topcitytickets@gmail.com') as public_count;

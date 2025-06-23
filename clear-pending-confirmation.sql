-- Clear any pending email confirmations and reset the admin user
-- This will allow fresh signup attempts

-- First, check current state
SELECT 
  id,
  email,
  email_confirmed_at,
  confirmation_token,
  created_at
FROM auth.users 
WHERE email = 'topcitytickets@gmail.com';

-- Option 1: Clear the pending confirmation (if user exists in auth.users)
UPDATE auth.users 
SET 
  confirmation_token = '',
  email_confirmed_at = NOW(),
  updated_at = NOW()
WHERE email = 'topcitytickets@gmail.com';

-- Option 2: Delete and start fresh (if you want to sign up again)
-- DELETE FROM auth.users WHERE email = 'topcitytickets@gmail.com';
-- DELETE FROM public.users WHERE email = 'topcitytickets@gmail.com';

-- Check if it worked
SELECT 
  'After update:' as status,
  id,
  email,
  email_confirmed_at IS NOT NULL as email_confirmed,
  confirmation_token = '' as token_cleared
FROM auth.users 
WHERE email = 'topcitytickets@gmail.com';

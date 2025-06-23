-- Quick fix: Mark the user as confirmed without needing email click
-- Since the email was sent but expired, let's just confirm it manually

-- Step 1: Check if user exists and needs confirmation
SELECT 
  'User status:' as info,
  email,
  email_confirmed_at,
  created_at
FROM auth.users 
WHERE email = 'topcitytickets@gmail.com';

-- Step 2: Manually confirm the email (skip the expired link)
UPDATE auth.users 
SET 
  email_confirmed_at = NOW(),
  confirmation_token = '',
  updated_at = NOW()
WHERE email = 'topcitytickets@gmail.com';

-- Step 3: Ensure the public.users record exists with admin role
INSERT INTO public.users (id, email, role)
SELECT id, email, 'admin'
FROM auth.users 
WHERE email = 'topcitytickets@gmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- Step 4: Verify everything is ready for login
SELECT 
  'Ready to login:' as status,
  au.email,
  au.email_confirmed_at IS NOT NULL as email_confirmed,
  pu.role,
  'Login at: https://topcitytickets.org/login' as next_step
FROM auth.users au
JOIN public.users pu ON pu.id = au.id
WHERE au.email = 'topcitytickets@gmail.com';

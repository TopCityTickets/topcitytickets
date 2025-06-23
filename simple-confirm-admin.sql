-- Even simpler approach: Just mark the user as confirmed
-- This skips the email confirmation step entirely

-- Check current status
SELECT 
  'Current status:' as info,
  email,
  email_confirmed_at,
  confirmation_token,
  created_at
FROM auth.users 
WHERE email = 'topcitytickets@gmail.com';

-- Mark email as confirmed (this allows login without clicking email link)
UPDATE auth.users 
SET 
  email_confirmed_at = NOW(),
  confirmation_token = '',
  confirmation_sent_at = NULL,
  updated_at = NOW()
WHERE email = 'topcitytickets@gmail.com';

-- Verify the user can now login
SELECT 
  'After update:' as status,
  email,
  email_confirmed_at IS NOT NULL as can_login,
  confirmation_token = '' as no_pending_confirmation
FROM auth.users 
WHERE email = 'topcitytickets@gmail.com';

-- Also ensure the public.users record exists with admin role
INSERT INTO public.users (id, email, role)
SELECT id, email, 'admin'
FROM auth.users 
WHERE email = 'topcitytickets@gmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- Final verification
SELECT 
  'Final check:' as info,
  pu.email,
  pu.role,
  au.email_confirmed_at IS NOT NULL as auth_confirmed
FROM public.users pu
JOIN auth.users au ON pu.id = au.id
WHERE pu.email = 'topcitytickets@gmail.com';

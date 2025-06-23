-- Quick check for your specific user ID
-- Replace with your actual UUID: c09e0cbf-bb61-44bf-a4f4-7cb59fb1727c

-- Check auth.users record
SELECT 
  'AUTH.USERS' as table_name,
  id,
  email,
  created_at
FROM auth.users 
WHERE id = 'c09e0cbf-bb61-44bf-a4f4-7cb59fb1727c';

-- Check public.users record
SELECT 
  'PUBLIC.USERS' as table_name,
  id,
  email,
  role,
  created_at,
  updated_at
FROM public.users 
WHERE id = 'c09e0cbf-bb61-44bf-a4f4-7cb59fb1727c';

-- Make sure there's only ONE record and it's admin
DELETE FROM public.users WHERE id = 'c09e0cbf-bb61-44bf-a4f4-7cb59fb1727c';

INSERT INTO public.users (id, email, role, created_at, updated_at)
VALUES (
  'c09e0cbf-bb61-44bf-a4f4-7cb59fb1727c',
  'topcitytickets@gmail.com',
  'admin',
  NOW(),
  NOW()
);

-- Final verification
SELECT 
  'FINAL CHECK' as status,
  id,
  email,
  role,
  'Should be admin' as expected
FROM public.users 
WHERE id = 'c09e0cbf-bb61-44bf-a4f4-7cb59fb1727c';

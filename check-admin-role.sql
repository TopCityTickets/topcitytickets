-- Check if topcitytickets@gmail.com exists and their role
SELECT 
  id,
  email,
  role,
  created_at,
  updated_at
FROM auth.users
LEFT JOIN public.users ON auth.users.id = public.users.id
WHERE auth.users.email = 'topcitytickets@gmail.com';

-- If the user exists but doesn't have admin role, update it
UPDATE public.users 
SET role = 'admin', updated_at = NOW()
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'topcitytickets@gmail.com'
) AND role != 'admin';

-- Verify the update
SELECT 
  id,
  email,
  role,
  created_at,
  updated_at
FROM auth.users
LEFT JOIN public.users ON auth.users.id = public.users.id
WHERE auth.users.email = 'topcitytickets@gmail.com';

-- Also check if there are any other admin users
SELECT 
  auth.users.id,
  auth.users.email,
  public.users.role
FROM auth.users
LEFT JOIN public.users ON auth.users.id = public.users.id
WHERE public.users.role = 'admin';

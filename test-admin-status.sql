-- Test current admin user status
SELECT 
  id,
  email,
  role,
  created_at,
  updated_at,
  LENGTH(role) as role_length,
  ASCII(SUBSTRING(role, 1, 1)) as first_char_ascii
FROM users 
WHERE email = 'topcitytickets@gmail.com';

-- Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'users';

-- Test RLS policies
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'users';

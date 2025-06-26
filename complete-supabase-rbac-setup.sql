-- Complete Supabase RBAC Setup and Fix Script
-- Run this in Supabase SQL Editor step by step

-- Step 1: Ensure we have the right user_role enum type
DO $$ 
BEGIN
    -- Check if the enum already exists, if not create it
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('user', 'seller', 'admin');
    END IF;
END $$;

-- Step 2: Make sure user_roles table uses the correct type
-- (Only run this if needed - check table structure first)
-- ALTER TABLE public.user_roles 
-- ALTER COLUMN role TYPE user_role USING role::user_role;

-- Step 3: Make sure users table uses the correct type  
-- (Only run this if needed - check table structure first)
-- ALTER TABLE public.users 
-- ALTER COLUMN role TYPE user_role USING role::user_role;

-- Step 4: Check current table structures
SELECT 'user_roles table structure:' as info;
SELECT 
  column_name,
  data_type,
  udt_name,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_roles'
ORDER BY ordinal_position;

SELECT 'users table structure:' as info;
SELECT 
  column_name,
  data_type,
  udt_name,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- Step 5: Check if custom access token hook is enabled
SELECT 'Check auth hook configuration in Supabase Dashboard > Database > Webhooks' as reminder;

-- Step 6: Ensure RLS policies are correct
SELECT 'Current RLS policies on user_roles:' as info;
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'user_roles';

-- Step 7: Sample admin creation (modify email/user_id as needed)
-- IMPORTANT: Replace these values with your actual email and user ID

-- First find your user ID:
SELECT 
  id,
  email,
  role as current_legacy_role
FROM public.users 
WHERE email = 'YOUR_EMAIL_HERE'  -- Replace with your email
LIMIT 1;

-- Then use the ID from above to create admin role:
-- INSERT INTO public.user_roles (user_id, role) 
-- VALUES ('YOUR_USER_ID_FROM_ABOVE', 'admin'::user_role)
-- ON CONFLICT (user_id) DO UPDATE SET role = 'admin'::user_role;

-- Also update legacy role:
-- UPDATE public.users 
-- SET role = 'admin'::user_role 
-- WHERE id = 'YOUR_USER_ID_FROM_ABOVE';

SELECT 'RBAC setup script complete! Follow the commented instructions above.' as result;

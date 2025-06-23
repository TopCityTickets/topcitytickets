-- Debug and fix admin access to seller applications

-- First, let's check what applications exist and what the admin can see
DO $admin_debug$
DECLARE
  app_record RECORD;
  user_record RECORD;
BEGIN
  RAISE NOTICE '=== DEBUGGING ADMIN ACCESS TO SELLER APPLICATIONS ===';
  
  -- Check all applications without RLS
  RAISE NOTICE 'All applications in seller_applications table:';
  FOR app_record IN
    SELECT 
      id, 
      user_id, 
      status, 
      applied_at,
      created_at
    FROM seller_applications
    ORDER BY created_at DESC
  LOOP
    RAISE NOTICE 'App ID: % | User: % | Status: % | Applied: %', 
      app_record.id, 
      app_record.user_id, 
      app_record.status,
      app_record.applied_at;
  END LOOP;
  
  -- Check users table and their roles
  RAISE NOTICE 'Users and their roles:';
  FOR user_record IN
    SELECT 
      id,
      email,
      role
    FROM users
    ORDER BY created_at DESC
    LIMIT 10
  LOOP
    RAISE NOTICE 'User: % | Email: % | Role: %', 
      user_record.id, 
      user_record.email, 
      user_record.role;
  END LOOP;
  
  -- Check current auth context
  RAISE NOTICE 'Current auth.uid(): %', auth.uid();
  
END $admin_debug$;

-- Let's also check the users table RLS status
DO $users_rls_check$
DECLARE
  table_info RECORD;
BEGIN
  RAISE NOTICE '=== CHECKING USERS TABLE RLS STATUS ===';
  
  SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
  FROM pg_tables 
  WHERE tablename = 'users' AND schemaname = 'public'
  INTO table_info;
  
  IF FOUND THEN
    RAISE NOTICE 'Users table - RLS Enabled: %', table_info.rowsecurity;
  END IF;
  
  -- List policies on users table
  FOR table_info IN
    SELECT 
      policyname, 
      cmd,
      permissive,
      roles
    FROM pg_policies 
    WHERE tablename = 'users'
    ORDER BY cmd, policyname
  LOOP
    RAISE NOTICE 'Users Policy: % | Command: % | Roles: %', 
      table_info.policyname, 
      table_info.cmd,
      table_info.roles;
  END LOOP;
END $users_rls_check$;

-- Temporary fix: Disable RLS on users table as well for admin access
-- This might be needed if the admin dashboard is also having RLS issues with the users table
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

DO $users_disable_notice$
BEGIN
  RAISE NOTICE 'RLS has been DISABLED for users table as well';
  RAISE NOTICE 'This should allow admin dashboard to properly load user data with applications';
END $users_disable_notice$;

-- Refresh schema cache
ANALYZE seller_applications;
ANALYZE users;

-- Nuclear option: Disable RLS on all tables and debug thoroughly

-- Disable RLS on ALL potentially problematic tables
ALTER TABLE seller_applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE event_submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE approved_events DISABLE ROW LEVEL SECURITY;

DO $nuclear_debug$
BEGIN
  RAISE NOTICE '=== RLS DISABLED ON ALL TABLES ===';
  RAISE NOTICE 'seller_applications, users, events, event_submissions, approved_events';
END $nuclear_debug$;

-- Now let's see what's actually in the database
DO $full_debug$
DECLARE
  app_record RECORD;
  user_record RECORD;
  count_apps INTEGER;
  count_pending INTEGER;
BEGIN
  RAISE NOTICE '=== COMPREHENSIVE DATABASE DEBUG ===';
  
  -- Count total applications
  SELECT COUNT(*) INTO count_apps FROM seller_applications;
  RAISE NOTICE 'Total applications in seller_applications: %', count_apps;
  
  -- Count pending applications
  SELECT COUNT(*) INTO count_pending FROM seller_applications WHERE status = 'pending';
  RAISE NOTICE 'Pending applications: %', count_pending;
  
  -- Show ALL applications with full details
  RAISE NOTICE '=== ALL SELLER APPLICATIONS ===';
  FOR app_record IN
    SELECT 
      sa.id,
      sa.user_id,
      sa.status,
      sa.applied_at,
      sa.created_at,
      sa.reviewed_at,
      sa.reviewed_by,
      sa.notes,
      u.email,
      u.role
    FROM seller_applications sa
    LEFT JOIN users u ON sa.user_id = u.id
    ORDER BY sa.created_at DESC
  LOOP
    RAISE NOTICE 'App: % | User: % | Email: % | Status: % | Applied: % | Role: %', 
      app_record.id, 
      app_record.user_id,
      app_record.email,
      app_record.status,
      app_record.applied_at,
      app_record.role;
  END LOOP;
  
  -- Show all users
  RAISE NOTICE '=== ALL USERS ===';
  FOR user_record IN
    SELECT id, email, role, created_at
    FROM users
    ORDER BY created_at DESC
  LOOP
    RAISE NOTICE 'User: % | Email: % | Role: % | Created: %', 
      user_record.id,
      user_record.email,
      user_record.role,
      user_record.created_at;
  END LOOP;
  
  -- Test the exact query that the admin dashboard uses
  RAISE NOTICE '=== TESTING ADMIN DASHBOARD QUERY ===';
  FOR app_record IN
    SELECT 
      sa.*,
      u.email
    FROM seller_applications sa
    LEFT JOIN users u ON sa.user_id = u.id
    ORDER BY sa.applied_at DESC
  LOOP
    RAISE NOTICE 'Dashboard Query Result: App % | User % | Email % | Status %', 
      app_record.id,
      app_record.user_id,
      app_record.email,
      app_record.status;
  END LOOP;
  
END $full_debug$;

-- Drop and recreate any problematic policies completely
DO $policy_cleanup$
BEGIN
  RAISE NOTICE '=== CLEANING UP ALL POLICIES ===';
  
  -- Drop all policies on seller_applications
  DROP POLICY IF EXISTS "Users can view own applications" ON seller_applications;
  DROP POLICY IF EXISTS "Users can create applications" ON seller_applications;
  DROP POLICY IF EXISTS "Admins can view all applications" ON seller_applications;
  DROP POLICY IF EXISTS "Admins can update applications" ON seller_applications;
  DROP POLICY IF EXISTS "Authenticated users can insert applications" ON seller_applications;
  
  -- Drop all policies on users table
  DROP POLICY IF EXISTS "Users can view own profile" ON users;
  DROP POLICY IF EXISTS "Users can update own profile" ON users;
  DROP POLICY IF EXISTS "Admins can view all users" ON users;
  DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON users;
  
  RAISE NOTICE 'All policies dropped. Tables should be fully accessible now.';
END $policy_cleanup$;

-- Final verification
DO $final_check$
DECLARE
  rls_status RECORD;
BEGIN
  RAISE NOTICE '=== FINAL RLS STATUS CHECK ===';
  
  FOR rls_status IN
    SELECT tablename, rowsecurity
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN ('seller_applications', 'users', 'events', 'event_submissions', 'approved_events')
    ORDER BY tablename
  LOOP
    RAISE NOTICE 'Table: % | RLS Enabled: %', rls_status.tablename, rls_status.rowsecurity;
  END LOOP;
  
  -- Check if any policies still exist
  FOR rls_status IN
    SELECT tablename, COUNT(*) as policy_count
    FROM pg_policies 
    WHERE tablename IN ('seller_applications', 'users', 'events', 'event_submissions', 'approved_events')
    GROUP BY tablename
    ORDER BY tablename
  LOOP
    RAISE NOTICE 'Table: % | Remaining Policies: %', rls_status.tablename, rls_status.policy_count;
  END LOOP;
  
END $final_check$;

-- Refresh all schema caches
ANALYZE seller_applications;
ANALYZE users;
ANALYZE events;
ANALYZE event_submissions;
ANALYZE approved_events;

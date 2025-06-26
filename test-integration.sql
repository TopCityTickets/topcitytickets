-- Test RBAC and Payment System Integration
-- Run this in Supabase SQL Editor to verify everything is working

-- 1. Check if RBAC tables exist and have data
SELECT 'RBAC Tables Status:' as test_section;

SELECT 
  'user_roles' as table_name,
  count(*) as record_count,
  array_agg(DISTINCT role) as roles_found
FROM public.user_roles;

SELECT 
  'role_permissions' as table_name,
  count(*) as record_count,
  array_agg(DISTINCT role) as roles_with_permissions
FROM public.role_permissions;

-- 2. Check if payment tables exist
SELECT 'Payment Tables Status:' as test_section;

SELECT 
  'user_payment_methods' as table_name,
  count(*) as record_count
FROM public.user_payment_methods;

SELECT 
  'user_stripe_accounts' as table_name,
  count(*) as record_count
FROM public.user_stripe_accounts;

-- 3. Check if triggers exist
SELECT 'Triggers Status:' as test_section;

SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND trigger_name IN ('on_auth_user_created', 'update_user_payment_methods_updated_at', 'update_user_stripe_accounts_updated_at')
ORDER BY trigger_name;

-- 4. Check if the custom access token hook function exists
SELECT 'Custom Access Token Hook:' as test_section;

SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'custom_access_token_hook';

-- 5. Check if handle_new_user function exists
SELECT 'New User Handler Function:' as test_section;

SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'handle_new_user';

-- 6. Test if policies are working (check RLS policies)
SELECT 'RLS Policies Status:' as test_section;

SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('user_payment_methods', 'user_stripe_accounts')
ORDER BY tablename, policyname;

SELECT 'RBAC and Payment System Integration Test Complete!' as result;

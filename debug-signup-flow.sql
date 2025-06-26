-- DEBUG SIGNUP FLOW - Run this to test what happens during signup
-- This will help us understand exactly where the "Database error finding user" occurs

-- ========================================
-- 1. CHECK IF TRIGGER EXISTS AND IS WORKING
-- ========================================

SELECT '=== CHECKING AUTH.USERS TRIGGER ===' as section;

-- Check if our trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM 
    information_schema.triggers
WHERE 
    event_object_schema = 'auth' 
    AND event_object_table = 'users'
    AND trigger_name = 'on_auth_user_created';

-- Check if the function exists
SELECT 
    routine_name,
    routine_type,
    routine_schema
FROM 
    information_schema.routines
WHERE 
    routine_name = 'handle_auth_user_created'
    AND routine_schema = 'public';

-- ========================================
-- 2. SIMULATE THE SIGNUP PROCESS
-- ========================================

SELECT '=== SIMULATING SIGNUP PROCESS ===' as section;

-- Check current users
SELECT 'Current users:' as info, COUNT(*) as count FROM auth.users;
SELECT 'Current public users:' as info, COUNT(*) as count FROM public.users;

-- Let's manually test what happens when we insert into auth.users
-- This simulates what Supabase does during signup
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
    test_email TEXT := 'test_signup_' || floor(random() * 1000) || '@example.com';
BEGIN
    RAISE NOTICE 'Testing signup process with email: %', test_email;
    
    -- Try to insert into auth.users (this should trigger our function)
    BEGIN
        INSERT INTO auth.users (id, instance_id, email, aud, role, encrypted_password, email_confirmed_at, created_at, updated_at)
        VALUES (
            test_user_id,
            '00000000-0000-0000-0000-000000000000',
            test_email,
            'authenticated',
            'authenticated',
            crypt('test123', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Successfully inserted user into auth.users';
        
        -- Check if the trigger created a record in public.users
        IF EXISTS (SELECT 1 FROM public.users WHERE id = test_user_id) THEN
            RAISE NOTICE 'SUCCESS: Trigger created user in public.users';
        ELSE
            RAISE NOTICE 'ERROR: Trigger did NOT create user in public.users';
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ERROR inserting into auth.users: %', SQLERRM;
    END;
    
    -- Clean up test user
    DELETE FROM auth.users WHERE id = test_user_id;
    DELETE FROM public.users WHERE id = test_user_id;
    
    RAISE NOTICE 'Cleaned up test user';
END $$;

-- ========================================
-- 3. CHECK RLS POLICIES ON PUBLIC.USERS
-- ========================================

SELECT '=== CHECKING RLS POLICIES ===' as section;

-- Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM 
    pg_tables 
WHERE 
    schemaname = 'public' 
    AND tablename = 'users';

-- List all RLS policies
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM 
    pg_policies 
WHERE 
    schemaname = 'public' 
    AND tablename = 'users'
ORDER BY 
    policyname;

-- ========================================
-- 4. CHECK FOR AUTH HOOKS THAT MIGHT INTERFERE
-- ========================================

SELECT '=== CHECKING FOR AUTH HOOKS ===' as section;

-- Check for any remaining JWT or auth hooks
SELECT 
    routine_name,
    routine_type,
    routine_schema
FROM 
    information_schema.routines
WHERE 
    routine_schema = 'auth'
    AND (routine_name LIKE '%jwt%' OR routine_name LIKE '%hook%' OR routine_name LIKE '%token%')
ORDER BY 
    routine_name;

-- ========================================
-- 5. RECOMMENDATIONS
-- ========================================

SELECT '=== RECOMMENDATIONS ===' as section;
SELECT 'If the trigger test above failed, the issue is with the trigger function' as issue;
SELECT 'If RLS policies are too restrictive, they might block the insert' as issue;
SELECT 'If auth hooks exist, they might be interfering with the signup process' as issue;
SELECT 'Check the browser console and Supabase logs for specific error messages' as next_step;

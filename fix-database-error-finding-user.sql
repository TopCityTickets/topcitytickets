-- FIX DATABASE ERROR FINDING USER
-- This script specifically addresses the "Database error finding user" issue
-- by examining auth hooks and fixing potential issues with the auth/users tables

-- ========================================
-- 1. DIAGNOSE THE ISSUE
-- ========================================

SELECT '=== DIAGNOSING DATABASE ERROR FINDING USER ===' as section;

-- Check if auth.users exists but public.users doesn't
SELECT 
    (SELECT COUNT(*) FROM auth.users) as auth_users_count,
    (SELECT COUNT(*) FROM public.users) as public_users_count;

-- Check auth triggers that might be causing issues
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth' AND event_object_table = 'users'
ORDER BY trigger_name;

-- Check auth functions that might be interfering
SELECT routine_name, routine_type, data_type
FROM information_schema.routines
WHERE routine_schema = 'auth' AND routine_name LIKE '%user%'
ORDER BY routine_name;

-- ========================================
-- 2. DISABLE PROBLEMATIC HOOKS/TRIGGERS
-- ========================================

-- IMPORTANT: Disable the JWT claim function that often causes this error
DO $$
BEGIN
    -- Check if the function exists
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'jwt') THEN
        -- Drop the JWT function if it exists
        DROP FUNCTION IF EXISTS auth.jwt() CASCADE;
        RAISE NOTICE 'Dropped auth.jwt() function';
    ELSE
        RAISE NOTICE 'No auth.jwt() function found';
    END IF;
    
    -- Check if custom_access_token_hook exists and drop it
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'custom_access_token_hook') THEN
        DROP FUNCTION IF EXISTS auth.custom_access_token_hook() CASCADE;
        RAISE NOTICE 'Dropped auth.custom_access_token_hook() function';
    ELSE
        RAISE NOTICE 'No auth.custom_access_token_hook() function found';
    END IF;
END $$;

-- ========================================
-- 3. ENSURE PUBLIC.USERS TABLE SYNCS WITH AUTH.USERS
-- ========================================

-- Create the on_auth_user_created trigger if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, role)
    VALUES (NEW.id, NEW.email, 'user')
    ON CONFLICT (id) DO UPDATE
    SET email = NEW.email;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if the trigger exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
        -- Create the trigger
        CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_new_user();
        RAISE NOTICE 'Created on_auth_user_created trigger';
    ELSE
        RAISE NOTICE 'on_auth_user_created trigger already exists';
    END IF;
END $$;

-- ========================================
-- 4. FIX AUTH USERS WHO MIGHT BE MISSING FROM PUBLIC USERS
-- ========================================

-- Fix any missing users (auth.users exists but not in public.users)
INSERT INTO public.users (id, email, role)
SELECT au.id, au.email, 'user'
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.users pu WHERE pu.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 5. UPDATE YOUR EMERGENCY ADMIN SQL TO HANDLE USER CREATION PROPERLY
-- ========================================

-- This is a safer way to ensure an admin exists (add to your emergency-admin-fix.sql)
-- Replace 'your-admin-email@example.com' with your actual admin email
DO $$
DECLARE
    v_admin_email TEXT := 'your-admin-email@example.com'; -- Replace with your admin email
    v_user_id UUID;
BEGIN
    -- Get the user ID
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_admin_email;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'No user found with email %', v_admin_email;
    END IF;
    
    -- Ensure user exists in public.users
    INSERT INTO public.users (id, email, role, first_name, last_name)
    VALUES (v_user_id, v_admin_email, 'admin', 'Admin', 'User')
    ON CONFLICT (id) DO UPDATE
    SET role = 'admin', email = v_admin_email;
    
    -- Ensure admin role exists in user_roles
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'admin'::user_role)
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'User % has been made an admin', v_admin_email;
END $$;

-- ========================================
-- 6. VERIFY USER CREATION WORKS
-- ========================================

SELECT '=== VERIFICATION OF USER SETUP ===' as section;

-- Verify if auth.users and public.users are in sync
SELECT 
    (SELECT COUNT(*) FROM auth.users) as auth_users_count,
    (SELECT COUNT(*) FROM public.users) as public_users_count,
    (SELECT COUNT(*) FROM auth.users au WHERE NOT EXISTS (
        SELECT 1 FROM public.users pu WHERE pu.id = au.id
    )) as users_only_in_auth;

SELECT '=== NEXT STEPS ===' as section;
SELECT 'After running this, try to sign up again.' as message;
SELECT 'If you still have issues, check the Supabase dashboard > Authentication > Hooks and disable any custom JWT claims or hooks.' as message;

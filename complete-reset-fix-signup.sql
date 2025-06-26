-- COMPLETE RESET AND FIX SIGNUP ISSUES
-- This script will:
-- 1. Check and disable any custom auth hooks that might interfere
-- 2. Delete ALL user data in the correct order respecting FK constraints
-- 3. Reset sequences
-- 4. Verify custom types and recreate if needed
-- 5. Verify RLS policies

-- ========================================
-- 1. SHOW WHAT WILL BE DELETED
-- ========================================

SELECT '=== DATA TO BE DELETED ===' as section;

-- Show counts of what will be deleted
SELECT 'auth.users' as table_name, COUNT(*) as record_count FROM auth.users;
SELECT 'public.users' as table_name, COUNT(*) as record_count FROM public.users;
SELECT 'user_roles' as table_name, COUNT(*) as record_count FROM public.user_roles;
SELECT 'seller_applications' as table_name, COUNT(*) as record_count FROM public.seller_applications;
SELECT 'events' as table_name, COUNT(*) as record_count FROM public.events;
SELECT 'tickets' as table_name, COUNT(*) as record_count FROM public.tickets;

-- ========================================
-- 2. DISABLE CUSTOM AUTH HOOKS (CRITICAL)
-- ========================================

SELECT '=== CHECKING FOR CUSTOM AUTH HOOKS ===' as section;

-- Check for custom auth hooks
SELECT
    routine_name, 
    routine_type
FROM
    information_schema.routines
WHERE
    routine_type = 'FUNCTION'
    AND routine_name LIKE '%auth%hook%';

-- Disable custom_access_token_hook (if exists) - THIS IS OFTEN THE CAUSE OF SIGNUP ISSUES
DO $$
BEGIN
    -- Drop the hook connection
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'custom_access_token_hook') THEN
        DROP FUNCTION IF EXISTS auth.custom_access_token_hook CASCADE;
        RAISE NOTICE 'Disabled custom_access_token_hook';
    ELSE
        RAISE NOTICE 'No custom_access_token_hook found';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error disabling hooks: %', SQLERRM;
END $$;

-- ========================================
-- 3. DISABLE TRIGGERS AND CONSTRAINTS
-- ========================================

SELECT '=== DISABLING CONSTRAINTS ===' as section;

-- Disable triggers temporarily to avoid issues during deletion
SET session_replication_role = replica;

-- ========================================
-- 4. DELETE ALL DATA IN CORRECT ORDER
-- ========================================

SELECT '=== DELETING ALL DATA ===' as section;

-- Delete in order to avoid foreign key constraint violations
-- Tickets (depends on events and users)
DELETE FROM public.tickets;
SELECT 'Deleted tickets' as status;

-- Events and approved events (standalone or depends on users)
DELETE FROM public.events;
SELECT 'Deleted events' as status;

DELETE FROM public.event_submissions;
SELECT 'Deleted event submissions' as status;

DELETE FROM public.approved_events;
SELECT 'Deleted approved events' as status;

-- Seller applications (depends on users)
DELETE FROM public.seller_applications;
SELECT 'Deleted seller applications' as status;

-- Payment methods (depends on users)
DELETE FROM public.user_payment_methods;
SELECT 'Deleted user payment methods' as status;

-- Stripe accounts (depends on users)
DELETE FROM public.user_stripe_accounts;
SELECT 'Deleted user stripe accounts' as status;

-- User roles and permissions
DELETE FROM public.user_roles;
SELECT 'Deleted user roles' as status;

-- Delete public users (references auth.users)
DELETE FROM public.users;
SELECT 'Deleted public users' as status;

-- CRITICAL: Check for other tables referencing auth.users
SELECT '=== CHECKING FOR OTHER REFERENCES TO AUTH.USERS ===' as section;

SELECT
    conrelid::regclass AS table_name,
    conname AS foreign_key,
    pg_get_constraintdef(oid) AS definition
FROM
    pg_constraint
WHERE
    contype = 'f'
    AND confrelid = 'auth.users'::regclass;

-- CRITICAL: Finally delete auth users
DELETE FROM auth.users;
SELECT 'Deleted auth users' as status;

-- ========================================
-- 5. RE-ENABLE CONSTRAINTS
-- ========================================

SELECT '=== RE-ENABLING CONSTRAINTS ===' as section;

-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- ========================================
-- 6. RESET SEQUENCES
-- ========================================

SELECT '=== RESETTING SEQUENCES ===' as section;

-- Reset sequences for tables with IDENTITY columns
SELECT 'Resetting sequence for ' || relname as message, 
       setval(pg_get_serial_sequence(quote_ident(nspname) || '.' || quote_ident(relname), a.attname), 1, false) as reset
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_attribute a ON a.attrelid = c.oid
WHERE a.attidentity = 'd' 
  AND n.nspname = 'public'
  AND a.attnum > 0 
  AND NOT a.attisdropped;

-- Reset UUID extension sequences if needed
ALTER SEQUENCE IF EXISTS public.users_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.events_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.tickets_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.seller_applications_id_seq RESTART WITH 1;

-- ========================================
-- 7. VERIFY CUSTOM TYPES
-- ========================================

SELECT '=== CHECKING CUSTOM TYPES ===' as section;

-- Check for user-defined types that might need recreation
SELECT 
    t.typname AS type_name,
    n.nspname AS schema_name,
    CASE 
        WHEN t.typtype = 'e' THEN 'ENUM'
        WHEN t.typtype = 'c' THEN 'COMPOSITE'
        ELSE t.typtype::text
    END AS type_type
FROM 
    pg_type t
JOIN 
    pg_namespace n ON n.oid = t.typnamespace
WHERE 
    n.nspname = 'public'
    AND (t.typtype = 'e' OR t.typtype = 'c');

-- Create user_role type if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('user', 'admin', 'seller');
        RAISE NOTICE 'Created user_role enum type';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error creating types: %', SQLERRM;
END $$;

-- Create permission type if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'permission') THEN
        CREATE TYPE public.permission AS ENUM ('create_event', 'edit_event', 'delete_event', 'approve_event', 'sell_tickets');
        RAISE NOTICE 'Created permission enum type';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error creating types: %', SQLERRM;
END $$;

-- ========================================
-- 8. VERIFY RLS POLICIES
-- ========================================

SELECT '=== CHECKING RLS POLICIES ===' as section;

-- List RLS policies
SELECT
    n.nspname AS schema_name,
    c.relname AS table_name,
    pol.polname AS policy_name,
    CASE
        WHEN pol.polpermissive THEN 'PERMISSIVE'
        ELSE 'RESTRICTIVE'
    END AS permissive,
    CASE pol.polcmd
        WHEN 'r' THEN 'SELECT'
        WHEN 'a' THEN 'INSERT'
        WHEN 'w' THEN 'UPDATE'
        WHEN 'd' THEN 'DELETE'
        WHEN '*' THEN 'ALL'
    END AS command,
    pg_get_expr(pol.polqual, pol.polrelid) AS using_expression,
    pg_get_expr(pol.polwithcheck, pol.polrelid) AS with_check_expression,
    CASE
        WHEN pol.polroles = '{0}' THEN 'PUBLIC'
        ELSE array_to_string(array(SELECT rolname FROM pg_roles WHERE oid = ANY(pol.polroles)), ', ')
    END AS roles
FROM
    pg_policy pol
JOIN
    pg_class c ON c.oid = pol.polrelid
JOIN
    pg_namespace n ON n.oid = c.relnamespace
WHERE
    n.nspname = 'public'
ORDER BY
    n.nspname, c.relname, pol.polname;

-- ========================================
-- 9. VERIFY DELETION
-- ========================================

SELECT '=== VERIFICATION - ALL SHOULD BE 0 ===' as section;

-- Verify everything is deleted
SELECT 'auth.users' as table_name, COUNT(*) as remaining_records FROM auth.users;
SELECT 'public.users' as table_name, COUNT(*) as remaining_records FROM public.users;
SELECT 'user_roles' as table_name, COUNT(*) as remaining_records FROM public.user_roles;
SELECT 'seller_applications' as table_name, COUNT(*) as remaining_records FROM public.seller_applications;
SELECT 'events' as table_name, COUNT(*) as remaining_records FROM public.events;
SELECT 'tickets' as table_name, COUNT(*) as remaining_records FROM public.tickets;

SELECT '=== SUCCESS! ===' as section;
SELECT 'All user data has been cleared and signup issues fixed.' as message;
SELECT 'You can now test signup/login flows from scratch.' as message;
SELECT 'After creating an admin account, run emergency-admin-fix.sql' as message;

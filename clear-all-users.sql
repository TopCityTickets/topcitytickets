-- CLEAR ALL USER DATA - COMPLETE RESET
-- Run this in Supabase SQL Editor to safely clear all users and related data
-- CAUTION: This will delete ALL users, events, tickets, applications, etc.

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
SELECT 'event_submissions' as table_name, COUNT(*) as record_count FROM public.event_submissions;
SELECT 'tickets' as table_name, COUNT(*) as record_count FROM public.tickets;
SELECT 'user_payment_methods' as table_name, COUNT(*) as record_count FROM public.user_payment_methods;
SELECT 'user_stripe_accounts' as table_name, COUNT(*) as record_count FROM public.user_stripe_accounts;

-- ========================================
-- 2. DISABLE TRIGGERS AND CONSTRAINTS
-- ========================================

SELECT '=== DISABLING CONSTRAINTS ===' as section;

-- Disable triggers temporarily to avoid issues during deletion
SET session_replication_role = replica;

-- ========================================
-- 3. DELETE ALL DATA IN CORRECT ORDER
-- ========================================

SELECT '=== DELETING ALL DATA ===' as section;

-- Delete in order to avoid foreign key constraint violations
DO $$
BEGIN
    -- 1. Delete tickets first (references events and users)
    DELETE FROM public.tickets;
    RAISE NOTICE 'Deleted all tickets';

    -- 2. Delete events (references users)
    DELETE FROM public.events;
    RAISE NOTICE 'Deleted all events';

    -- 3. Delete event submissions (references users)
    DELETE FROM public.event_submissions;
    RAISE NOTICE 'Deleted all event submissions';

    -- 4. Delete approved events (standalone)
    DELETE FROM public.approved_events;
    RAISE NOTICE 'Deleted all approved events';

    -- 5. Delete seller applications (references users)
    DELETE FROM public.seller_applications;
    RAISE NOTICE 'Deleted all seller applications';

    -- 6. Delete user payment methods (references users)
    DELETE FROM public.user_payment_methods;
    RAISE NOTICE 'Deleted all user payment methods';

    -- 7. Delete user stripe accounts (references users)
    DELETE FROM public.user_stripe_accounts;
    RAISE NOTICE 'Deleted all user stripe accounts';

    -- 8. Delete user roles (references users)
    DELETE FROM public.user_roles;
    RAISE NOTICE 'Deleted all user roles';

    -- 9. Delete public users (references auth.users)
    DELETE FROM public.users;
    RAISE NOTICE 'Deleted all public users';

    -- 10. Delete auth users (must be last)
    DELETE FROM auth.users;
    RAISE NOTICE 'Deleted all auth users';
END $$;

-- ========================================
-- 4. RE-ENABLE CONSTRAINTS
-- ========================================

SELECT '=== RE-ENABLING CONSTRAINTS ===' as section;

-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- ========================================
-- 5. RESET SEQUENCES (OPTIONAL)
-- ========================================

SELECT '=== RESETTING SEQUENCES ===' as section;

-- Reset auto-increment sequences if you want clean IDs
DO $$
DECLARE
    seq_record RECORD;
BEGIN
    FOR seq_record IN 
        SELECT schemaname, sequencename 
        FROM pg_sequences 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ALTER SEQUENCE %I.%I RESTART WITH 1', 
            seq_record.schemaname, 
            seq_record.sequencename);
        RAISE NOTICE 'Reset sequence: %.%', 
            seq_record.schemaname, 
            seq_record.sequencename;
    END LOOP;
END $$;

-- ========================================
-- 6. VERIFY DELETION
-- ========================================

SELECT '=== VERIFICATION - ALL SHOULD BE 0 ===' as section;

-- Verify everything is deleted
SELECT 'auth.users' as table_name, COUNT(*) as remaining_records FROM auth.users;
SELECT 'public.users' as table_name, COUNT(*) as remaining_records FROM public.users;
SELECT 'user_roles' as table_name, COUNT(*) as remaining_records FROM public.user_roles;
SELECT 'seller_applications' as table_name, COUNT(*) as remaining_records FROM public.seller_applications;
SELECT 'events' as table_name, COUNT(*) as remaining_records FROM public.events;
SELECT 'event_submissions' as table_name, COUNT(*) as remaining_records FROM public.event_submissions;
SELECT 'tickets' as table_name, COUNT(*) as remaining_records FROM public.tickets;
SELECT 'user_payment_methods' as table_name, COUNT(*) as remaining_records FROM public.user_payment_methods;
SELECT 'user_stripe_accounts' as table_name, COUNT(*) as remaining_records FROM public.user_stripe_accounts;

SELECT '=== SUCCESS! ===' as section;
SELECT 'All user data has been cleared.' as message;
SELECT 'You can now test signup/login flows from scratch.' as message;
SELECT 'Remember to run your emergency-admin-fix.sql after creating your admin account!' as message;

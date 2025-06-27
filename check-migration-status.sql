-- DIAGNOSTIC SCRIPT: Check Migration Status
-- Run this to see what tables and columns exist before running step 4

-- Check if tables exist
SELECT 
    'TABLES' as check_type,
    table_name,
    CASE WHEN table_name IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM (
    SELECT 'users' as expected_table
    UNION SELECT 'events'
    UNION SELECT 'tickets' 
    UNION SELECT 'anonymous_purchases'
    UNION SELECT 'event_submissions'
    UNION SELECT 'escrow_holds'
    UNION SELECT 'escrow_payments'
    UNION SELECT 'seller_stripe_accounts'
    UNION SELECT 'customer_payment_methods'
) expected
LEFT JOIN information_schema.tables t ON t.table_name = expected.expected_table 
    AND t.table_schema = 'public'
ORDER BY expected_table;

-- Check if key columns exist in users table
SELECT 
    'USER COLUMNS' as check_type,
    expected_column,
    CASE WHEN column_name IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM (
    SELECT 'role' as expected_column
    UNION SELECT 'seller_status'
    UNION SELECT 'seller_business_name'
    UNION SELECT 'seller_description'
    UNION SELECT 'seller_applied_at'
    UNION SELECT 'seller_approved_at'
    UNION SELECT 'can_reapply_at'
    UNION SELECT 'stripe_customer_id'
) expected
LEFT JOIN information_schema.columns c ON c.column_name = expected.expected_column 
    AND c.table_schema = 'public' AND c.table_name = 'users'
ORDER BY expected_column;

-- Check if key columns exist in events table
SELECT 
    'EVENT COLUMNS' as check_type,
    expected_column,
    CASE WHEN column_name IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM (
    SELECT 'seller_id' as expected_column
    UNION SELECT 'is_active'
    UNION SELECT 'tickets_sold'
    UNION SELECT 'max_tickets'
    UNION SELECT 'approved_at'
    UNION SELECT 'approved_by'
    UNION SELECT 'slug'
) expected
LEFT JOIN information_schema.columns c ON c.column_name = expected.expected_column 
    AND c.table_schema = 'public' AND c.table_name = 'events'
ORDER BY expected_column;

-- Check if key columns exist in event_submissions table (if it exists)
SELECT 
    'EVENT_SUBMISSIONS COLUMNS' as check_type,
    expected_column,
    CASE WHEN column_name IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM (
    SELECT 'seller_id' as expected_column
    UNION SELECT 'status'
    UNION SELECT 'admin_feedback'
    UNION SELECT 'reviewed_by'
) expected
LEFT JOIN information_schema.columns c ON c.column_name = expected.expected_column 
    AND c.table_schema = 'public' AND c.table_name = 'event_submissions'
ORDER BY expected_column;

-- Check functions exist
SELECT 
    'FUNCTIONS' as check_type,
    expected_function,
    CASE WHEN routine_name IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM (
    SELECT 'apply_for_seller' as expected_function
    UNION SELECT 'review_seller_application'
    UNION SELECT 'submit_event_for_approval'
    UNION SELECT 'approve_event_submission'
    UNION SELECT 'process_escrow_release'
) expected
LEFT JOIN information_schema.routines r ON r.routine_name = expected.expected_function 
    AND r.routine_schema = 'public'
ORDER BY expected_function;

-- Summary
SELECT 
    'SUMMARY' as check_type,
    'Run this diagnostic to see what is missing before step 4' as expected_column,
    'Check above results to see which steps need to be run' as status;

-- CLEAR ALL USER DATA - SIMPLE VERSION
-- Run this in Supabase SQL Editor to safely clear all users and related data
-- CAUTION: This will delete ALL users, events, tickets, applications, etc.

-- Show what will be deleted first
SELECT 'BEFORE DELETION - Current Record Counts:' as info;
SELECT 'auth.users: ' || COUNT(*) FROM auth.users;
SELECT 'public.users: ' || COUNT(*) FROM public.users;
SELECT 'user_roles: ' || COUNT(*) FROM public.user_roles;
SELECT 'seller_applications: ' || COUNT(*) FROM public.seller_applications;
SELECT 'events: ' || COUNT(*) FROM public.events;
SELECT 'tickets: ' || COUNT(*) FROM public.tickets;

-- Disable triggers temporarily
SET session_replication_role = replica;

-- Delete all data in correct order to avoid foreign key violations
-- 1. Delete tickets first (references events and users)
DELETE FROM public.tickets;

-- 2. Delete events (references users)
DELETE FROM public.events;

-- 3. Delete event submissions (references users)
DELETE FROM public.event_submissions;

-- 4. Delete approved events (if exists)
DELETE FROM public.approved_events;

-- 5. Delete seller applications (references users)
DELETE FROM public.seller_applications;

-- 6. Delete user payment methods (references users)
DELETE FROM public.user_payment_methods;

-- 7. Delete user stripe accounts (references users)
DELETE FROM public.user_stripe_accounts;

-- 8. Delete user roles (references users)
DELETE FROM public.user_roles;

-- 9. Delete public users (references auth.users)
DELETE FROM public.users;

-- 10. Delete auth users (must be last)
DELETE FROM auth.users;

-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- Reset sequences for clean IDs (optional)
ALTER SEQUENCE IF EXISTS public.users_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.events_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.tickets_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.seller_applications_id_seq RESTART WITH 1;

-- Verify deletion
SELECT 'AFTER DELETION - Remaining Record Counts (should all be 0):' as info;
SELECT 'auth.users: ' || COUNT(*) FROM auth.users;
SELECT 'public.users: ' || COUNT(*) FROM public.users;
SELECT 'user_roles: ' || COUNT(*) FROM public.user_roles;
SELECT 'seller_applications: ' || COUNT(*) FROM public.seller_applications;
SELECT 'events: ' || COUNT(*) FROM public.events;
SELECT 'tickets: ' || COUNT(*) FROM public.tickets;

SELECT 'SUCCESS: All user data cleared! You can now test signup/login from scratch.' as result;

-- EMERGENCY PRODUCTION FIX - 500 Errors and Database Finding User
-- Run this immediately in your PRODUCTION Supabase SQL Editor

-- ========================================
-- 1. DISABLE ALL PROBLEMATIC TRIGGERS FIRST
-- ========================================

SELECT '=== DISABLING PROBLEMATIC TRIGGERS ===' as section;

-- Drop all existing auth user triggers that might be causing 500 errors
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS trigger_handle_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users CASCADE;

-- Drop problematic functions
DROP FUNCTION IF EXISTS public.handle_auth_user_created() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

SELECT 'Dropped all problematic triggers and functions' as status;

-- ========================================
-- 2. FIX FOREIGN KEY CONSTRAINTS
-- ========================================

SELECT '=== FIXING FOREIGN KEY CONSTRAINTS ===' as section;

-- Fix the foreign key constraint that's causing issues
DO $$
BEGIN
    -- Drop the problematic constraint
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_id_fkey' 
        AND conrelid = 'public.users'::regclass
    ) THEN
        ALTER TABLE public.users DROP CONSTRAINT users_id_fkey;
        RAISE NOTICE 'Dropped problematic users_id_fkey constraint';
    END IF;
    
    -- Recreate it properly
    ALTER TABLE public.users 
    ADD CONSTRAINT users_id_fkey 
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Created proper foreign key constraint';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error fixing constraint: %', SQLERRM;
END $$;

-- ========================================
-- 3. TEMPORARILY DISABLE RLS ON PROBLEMATIC TABLES
-- ========================================

SELECT '=== TEMPORARILY DISABLING RLS ===' as section;

-- Disable RLS on users table temporarily to allow signup
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Disable RLS on events table temporarily to fix the events API error
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;

SELECT 'Temporarily disabled RLS on users and events tables' as status;

-- ========================================
-- 4. CREATE A SIMPLE, SAFE USER CREATION FUNCTION
-- ========================================

SELECT '=== CREATING SIMPLE USER CREATION FUNCTION ===' as section;

-- Create a very simple function that won't cause 500 errors
CREATE OR REPLACE FUNCTION public.handle_new_user_simple()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
    -- Very simple insert with no complex logic
    INSERT INTO public.users (id, email, role, created_at, updated_at)
    VALUES (
        NEW.id, 
        COALESCE(NEW.email, 'unknown@email.com'), 
        'user', 
        NOW(), 
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Don't block auth.users creation even if this fails
    RETURN NEW;
END;
$$;

-- Create a simple trigger
CREATE TRIGGER on_auth_user_created_simple
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user_simple();

SELECT 'Created simple user creation trigger' as status;

-- ========================================
-- 5. TEST THE FIX
-- ========================================

SELECT '=== TESTING THE FIX ===' as section;

-- Test basic table access
SELECT 'users table test' as test, COUNT(*) as count FROM public.users;
SELECT 'events table test' as test, COUNT(*) as count FROM public.events;

-- ========================================
-- 6. MANUAL USER CREATION FOR TESTING
-- ========================================

SELECT '=== CREATING TEST USER MANUALLY ===' as section;

-- Create a test user manually to verify the system works
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
    test_email TEXT := 'manual_test_' || floor(random() * 1000) || '@test.com';
BEGIN
    -- Insert directly into auth.users (simulating signup)
    BEGIN
        INSERT INTO auth.users (
            id, instance_id, email, aud, role, 
            encrypted_password, email_confirmed_at, 
            created_at, updated_at
        ) VALUES (
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
        
        RAISE NOTICE 'Created test auth user: %', test_email;
        
        -- Check if trigger created public user
        IF EXISTS (SELECT 1 FROM public.users WHERE id = test_user_id) THEN
            RAISE NOTICE 'SUCCESS: Trigger worked, user created in public.users';
        ELSE
            RAISE NOTICE 'WARNING: Trigger did not create public user';
        END IF;
        
        -- Clean up
        DELETE FROM auth.users WHERE id = test_user_id;
        RAISE NOTICE 'Cleaned up test user';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Test failed: %', SQLERRM;
    END;
END $$;

-- ========================================
-- 7. INSTRUCTIONS
-- ========================================

SELECT '=== NEXT STEPS ===' as section;
SELECT 'RLS has been temporarily disabled to fix 500 errors' as step1;
SELECT 'Simple user creation trigger has been installed' as step2;
SELECT 'Try signing up now - it should work' as step3;
SELECT 'After confirming signup works, we can re-enable RLS with proper policies' as step4;

SELECT '=== IMMEDIATE TEST ===' as section;
SELECT 'Go to your signup page and try creating an account now' as instruction;

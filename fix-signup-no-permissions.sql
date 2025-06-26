-- SIMPLIFIED SIGNUP FIX - NO PERMISSION ISSUES
-- This script only fixes what we can control with SQL
-- Auth hooks MUST be disabled in Supabase Dashboard (see instructions below)

-- ========================================
-- CRITICAL MANUAL STEP FIRST!
-- ========================================
-- 1. Go to Supabase Dashboard > Authentication > Hooks
-- 2. DISABLE ALL HOOKS (especially Custom Access Token Claims)
-- 3. Save changes
-- 4. THEN run this script

-- ========================================
-- 1. CHECK CURRENT STATE
-- ========================================

SELECT '=== CHECKING CURRENT STATE ===' as section;

-- Check what auth functions exist (we can't drop them, but we can see them)
SELECT 
    routine_name, 
    routine_type,
    routine_schema
FROM 
    information_schema.routines 
WHERE 
    routine_schema = 'auth' 
    AND (routine_name LIKE '%jwt%' OR routine_name LIKE '%hook%')
ORDER BY routine_name;

-- Check current triggers on auth.users
SELECT 
    tgname as trigger_name,
    tgenabled as enabled
FROM 
    pg_trigger 
WHERE 
    tgrelid = 'auth.users'::regclass
    AND tgname != 'trigger_set_timestamp';

-- ========================================
-- 2. FIX PUBLIC.USERS TABLE STRUCTURE
-- ========================================

SELECT '=== FIXING PUBLIC.USERS TABLE ===' as section;

-- Ensure public.users has correct structure
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text;

-- Make sure constraints are correct
DO $$
BEGIN
    -- Fix foreign key constraint
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'public.users'::regclass 
        AND conname = 'users_id_fkey'
    ) THEN
        ALTER TABLE public.users 
        ADD CONSTRAINT users_id_fkey 
        FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added foreign key constraint';
    END IF;
    
    -- Fix email unique constraint
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'public.users'::regclass 
        AND conname = 'users_email_key'
    ) THEN
        ALTER TABLE public.users 
        ADD CONSTRAINT users_email_key UNIQUE (email);
        RAISE NOTICE 'Added email unique constraint';
    END IF;
END $$;

-- ========================================
-- 3. CREATE SIMPLE USER SYNC FUNCTION
-- ========================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.handle_auth_user_created() CASCADE;

-- Create a very simple sync function
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.users (id, email, role, created_at, updated_at)
    VALUES (
        NEW.id, 
        NEW.email, 
        'user', 
        NOW(), 
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = NEW.email,
        updated_at = NOW();
    
    RAISE NOTICE 'Created/updated user: %', NEW.email;
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error in handle_auth_user_created: %', SQLERRM;
    RETURN NEW; -- Don't block auth.users creation even if public.users fails
END;
$$;

-- ========================================
-- 4. CREATE THE TRIGGER
-- ========================================

-- Drop existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS trigger_handle_auth_user_created ON auth.users;

-- Create new trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_auth_user_created();

SELECT 'Created trigger: on_auth_user_created' as status;

-- ========================================
-- 5. FIX RLS POLICIES
-- ========================================

SELECT '=== FIXING RLS POLICIES ===' as section;

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;
DROP POLICY IF EXISTS users_select_policy ON public.users;
DROP POLICY IF EXISTS users_insert_policy ON public.users;
DROP POLICY IF EXISTS users_update_policy ON public.users;

-- Create simple, working policies
CREATE POLICY "Allow user to see their own data" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Allow user to insert their own data" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow user to update their own data" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Allow admins to see all users
CREATE POLICY "Allow admins to see all users" ON public.users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- ========================================
-- 6. TEST THE SETUP
-- ========================================

SELECT '=== TESTING SETUP ===' as section;

-- Verify trigger exists
SELECT 
    tgname as trigger_name,
    tgenabled as enabled,
    pg_get_triggerdef(oid) as definition
FROM 
    pg_trigger
WHERE 
    tgrelid = 'auth.users'::regclass
    AND tgname = 'on_auth_user_created';

-- Verify function exists
SELECT 
    proname as function_name,
    prosrc as source_code
FROM 
    pg_proc 
WHERE 
    proname = 'handle_auth_user_created';

-- Check RLS policies
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM 
    pg_policies 
WHERE 
    tablename = 'users' AND schemaname = 'public';

-- ========================================
-- 7. FINAL INSTRUCTIONS
-- ========================================

SELECT '=== CRITICAL NEXT STEPS ===' as section;
SELECT 'STEP 1: Go to Supabase Dashboard > Authentication > Hooks' as instruction;
SELECT 'STEP 2: Find "Custom Access Token Claims" or any JWT hooks' as instruction;
SELECT 'STEP 3: DISABLE or DELETE those hooks completely' as instruction;
SELECT 'STEP 4: Save the changes in the dashboard' as instruction;
SELECT 'STEP 5: Try signing up again' as instruction;
SELECT 'If you still get errors, the auth hooks in the dashboard are still active!' as warning;

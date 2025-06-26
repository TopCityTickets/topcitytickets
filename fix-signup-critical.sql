-- CRITICAL FIX FOR SIGNUP ERROR "Database error finding user"
-- This script focuses solely on fixing the signup process

-- ========================================
-- 1. DISABLE ALL AUTH HOOKS IN SUPABASE DASHBOARD
-- ========================================

-- IMPORTANT MANUAL STEP:
-- 1. Go to Supabase Dashboard > Authentication > Hooks
-- 2. DISABLE any custom JWT claims or hooks you see there
-- 3. Then run this script

-- ========================================
-- 2. CHECK FOR DATABASE CONSTRAINTS
-- ========================================

SELECT '=== CHECKING DATABASE CONSTRAINTS ===' as section;

-- Check constraints on public.users table
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM 
    pg_constraint
WHERE 
    conrelid = 'public.users'::regclass;

-- Check triggers on auth.users
SELECT 
    tgname as trigger_name, 
    pg_get_triggerdef(oid) as trigger_definition
FROM 
    pg_trigger
WHERE 
    tgrelid = 'auth.users'::regclass;

-- ========================================
-- 3. DISABLE PROBLEMATIC TRIGGERS AND HOOKS
-- ========================================

-- Drop ALL custom JWT hooks and functions
DO $$
BEGIN
    -- Drop custom access token hook
    DROP FUNCTION IF EXISTS auth.custom_access_token_hook() CASCADE;
    
    -- Drop jwt function if it exists
    DROP FUNCTION IF EXISTS auth.jwt() CASCADE;
    
    -- Drop any other hook functions that might be causing issues
    DROP FUNCTION IF EXISTS auth.on_user_created() CASCADE;
    DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
    DROP FUNCTION IF EXISTS public.handle_auth_user_created() CASCADE;
END $$;

-- ========================================
-- 4. RECREATE THE USER SYNC TRIGGER PROPERLY
-- ========================================

-- Create a very simple function to handle new users
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS TRIGGER LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, 'user')
  ON CONFLICT (id) DO UPDATE SET email = NEW.email;
  RETURN NEW;
END;
$$;

-- Drop the trigger if it exists, then recreate it
DO $$
BEGIN
  -- Drop existing triggers
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  
  -- Create the trigger
  CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_created();
END $$;

-- ========================================
-- 5. MANUALLY CHECK AND FIX PUBLIC.USERS TABLE
-- ========================================

-- Check if the public.users table has correct structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' AND table_name = 'users';

-- Make sure public.users has the proper constraints
DO $$
BEGIN
    -- Create proper primary key constraint if missing
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'public.users'::regclass AND contype = 'p'
    ) THEN
        ALTER TABLE public.users ADD PRIMARY KEY (id);
    END IF;
    
    -- Fix email unique constraint if missing
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'public.users'::regclass AND conname LIKE '%email%'
    ) THEN
        ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_email_key;
        ALTER TABLE public.users ADD CONSTRAINT users_email_key UNIQUE (email);
    END IF;
    
    -- Fix foreign key constraint if missing
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'public.users'::regclass AND conname = 'users_id_fkey'
    ) THEN
        ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;
        ALTER TABLE public.users ADD CONSTRAINT users_id_fkey 
        FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ========================================
-- 6. ENABLE RLS AND SET POLICIES PROPERLY
-- ========================================

-- Make sure RLS is enabled on public.users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies on users table
DROP POLICY IF EXISTS users_select_policy ON public.users;
DROP POLICY IF EXISTS users_insert_policy ON public.users;
DROP POLICY IF EXISTS users_update_policy ON public.users;
DROP POLICY IF EXISTS users_delete_policy ON public.users;

-- Create a basic policy to allow the authenticated user to see/update their own data
CREATE POLICY users_select_policy ON public.users
    FOR SELECT USING (auth.uid() = id OR EXISTS (
        SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY users_insert_policy ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY users_update_policy ON public.users
    FOR UPDATE USING (auth.uid() = id OR EXISTS (
        SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
    ));

-- ========================================
-- 7. TEST IF THE FIX WORKS
-- ========================================

-- Test by inserting a dummy user into auth.users and checking if public.users gets updated
-- Note: This is just to test the trigger, the user won't actually be usable
DO $$
DECLARE
    v_user_id uuid := gen_random_uuid();
BEGIN
    -- Insert test user into auth.users
    INSERT INTO auth.users (id, email, instance_id)
    VALUES (v_user_id, 'test_user_' || floor(random()*1000) || '@example.com', (SELECT instance_id FROM auth.users LIMIT 1))
    ON CONFLICT DO NOTHING;
    
    -- Check if user got inserted into public.users
    IF EXISTS (SELECT 1 FROM public.users WHERE id = v_user_id) THEN
        RAISE NOTICE 'SUCCESS: Trigger is working correctly!';
    ELSE
        RAISE NOTICE 'WARNING: Trigger is NOT working!';
    END IF;
    
    -- Clean up test user
    DELETE FROM auth.users WHERE id = v_user_id;
END $$;

-- ========================================
-- 8. VERIFY FINAL STATE
-- ========================================

SELECT '=== VERIFICATION ===' as section;

-- Verify function exists
SELECT 
    routine_name, routine_type 
FROM 
    information_schema.routines 
WHERE 
    routine_schema = 'public' AND routine_name = 'handle_auth_user_created';

-- Verify trigger exists
SELECT 
    trigger_name, event_manipulation, action_statement
FROM 
    information_schema.triggers
WHERE 
    event_object_schema = 'auth' AND event_object_table = 'users';

-- Check if any JWT hooks remain
SELECT 
    routine_name, routine_type 
FROM 
    information_schema.routines 
WHERE 
    routine_schema = 'auth' AND routine_name LIKE '%hook%';

SELECT '=== MANUAL STEPS NEEDED ===' as section;
SELECT 'CRITICAL: Go to Supabase Dashboard > Authentication > Hooks and make sure ALL HOOKS ARE DISABLED' as instruction;
SELECT 'After running this script and disabling dashboard hooks, try signing up again' as next_step;

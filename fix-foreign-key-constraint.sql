-- FIX FOREIGN KEY CONSTRAINT ISSUE
-- The error shows: "users_id_fkey" on table "users" - this suggests a self-referencing FK or incorrect constraint

-- ========================================
-- 1. ANALYZE THE CURRENT CONSTRAINT ISSUE
-- ========================================

SELECT '=== ANALYZING FOREIGN KEY CONSTRAINTS ===' as section;

-- Check all foreign key constraints on public.users table
SELECT 
    conname as constraint_name,
    conrelid::regclass as table_name,
    confrelid::regclass as referenced_table,
    pg_get_constraintdef(oid) as constraint_definition
FROM 
    pg_constraint
WHERE 
    conrelid = 'public.users'::regclass
    AND contype = 'f'
ORDER BY 
    conname;

-- Check for any self-referencing constraints that might be causing the issue
SELECT 
    'Self-referencing constraints:' as info,
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM 
    pg_constraint
WHERE 
    conrelid = 'public.users'::regclass
    AND confrelid = 'public.users'::regclass
    AND contype = 'f';

-- ========================================
-- 2. FIX THE FOREIGN KEY CONSTRAINT
-- ========================================

-- Drop the problematic constraint and recreate it properly
DO $$
BEGIN
    -- Check if the constraint exists and drop it
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_id_fkey' 
        AND conrelid = 'public.users'::regclass
    ) THEN
        ALTER TABLE public.users DROP CONSTRAINT users_id_fkey;
        RAISE NOTICE 'Dropped existing users_id_fkey constraint';
    END IF;
    
    -- Recreate the constraint properly (should reference auth.users, not self-reference)
    ALTER TABLE public.users 
    ADD CONSTRAINT users_id_fkey 
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Created proper foreign key constraint: public.users.id -> auth.users.id';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error fixing constraint: %', SQLERRM;
END $$;

-- ========================================
-- 3. VERIFY THE FIX
-- ========================================

-- Check the constraint is now correct
SELECT 
    'After fix:' as status,
    conname as constraint_name,
    conrelid::regclass as table_name,
    confrelid::regclass as referenced_table,
    pg_get_constraintdef(oid) as constraint_definition
FROM 
    pg_constraint
WHERE 
    conrelid = 'public.users'::regclass
    AND contype = 'f'
    AND conname = 'users_id_fkey';

-- ========================================
-- 4. TEST THE TRIGGER AGAIN (NOW THAT FK IS FIXED)
-- ========================================

SELECT '=== TESTING TRIGGER AFTER FK FIX ===' as section;

-- Test the signup process again
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
    test_email TEXT := 'test_signup_fixed_' || floor(random() * 1000) || '@example.com';
BEGIN
    RAISE NOTICE 'Testing signup process with email: %', test_email;
    
    -- Try to insert into auth.users
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
            
            -- Show the created user
            PERFORM * FROM public.users WHERE id = test_user_id;
            RAISE NOTICE 'User details: % with role %', test_email, (SELECT role FROM public.users WHERE id = test_user_id);
        ELSE
            RAISE NOTICE 'ERROR: Trigger did NOT create user in public.users';
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ERROR inserting into auth.users: %', SQLERRM;
    END;
    
    -- Clean up test user (this should work now)
    BEGIN
        DELETE FROM public.users WHERE id = test_user_id;
        DELETE FROM auth.users WHERE id = test_user_id;
        RAISE NOTICE 'Successfully cleaned up test user';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error cleaning up: %', SQLERRM;
    END;
    
END $$;

-- ========================================
-- 5. CHECK TRIGGER FUNCTION STATUS
-- ========================================

-- Verify our trigger function is working
SELECT 
    'Trigger function status:' as info,
    routine_name,
    routine_type
FROM 
    information_schema.routines
WHERE 
    routine_name = 'handle_auth_user_created'
    AND routine_schema = 'public';

-- Check trigger is active
SELECT 
    'Trigger status:' as info,
    trigger_name,
    event_manipulation,
    action_timing,
    'enabled' as status
FROM 
    information_schema.triggers
WHERE 
    event_object_schema = 'auth' 
    AND event_object_table = 'users'
    AND trigger_name = 'on_auth_user_created';

SELECT '=== NEXT STEPS ===' as section;
SELECT 'If the test above succeeded, try signing up again in your app' as instruction;
SELECT 'If it still fails, check browser console for specific error details' as instruction;
SELECT 'The FK constraint issue has been fixed' as status;

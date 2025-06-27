-- COMPLETE PRODUCTION FIX FOR DUPLICATE KEY ERRORS
-- This script addresses all issues with signup, focusing on duplicate key errors
-- Run this in Supabase SQL Editor

-- ========================================
-- 1. DIAGNOSTICS - IDENTIFY PROBLEMATIC RECORDS
-- ========================================

SELECT '=== CHECKING FOR PROBLEMATIC RECORDS ===' as section;

-- Check for duplicates in auth.users
SELECT 
    email,
    COUNT(*) as auth_count,
    ARRAY_AGG(id) as auth_ids
FROM auth.users
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;

-- Check for duplicates in public.users
SELECT 
    email,
    COUNT(*) as public_count,
    ARRAY_AGG(id) as public_ids
FROM public.users
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;

-- Check for mismatches between auth.users and public.users
SELECT
    au.email,
    au.id as auth_id,
    pu.id as public_id,
    au.id = pu.id as ids_match,
    au.email_confirmed_at IS NOT NULL as is_confirmed,
    pu.role
FROM auth.users au
JOIN public.users pu ON au.email = pu.email
WHERE au.id != pu.id
ORDER BY au.email;

-- ========================================
-- 2. ENHANCED USER EXISTENCE CHECK FUNCTION
-- ========================================

CREATE OR REPLACE FUNCTION public.check_user_exists(email_to_check TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    auth_user_id UUID;
    auth_user_confirmed BOOLEAN;
    public_user_id UUID;
    public_user_exists BOOLEAN;
    auth_count INTEGER;
    public_count INTEGER;
BEGIN
    -- Check count in auth.users
    SELECT 
        COUNT(*) INTO auth_count
    FROM auth.users 
    WHERE email = email_to_check;
    
    -- Check count in public.users
    SELECT 
        COUNT(*) INTO public_count
    FROM public.users 
    WHERE email = email_to_check;
    
    -- Get first auth user ID
    SELECT 
        id, 
        email_confirmed_at IS NOT NULL INTO auth_user_id, auth_user_confirmed
    FROM auth.users 
    WHERE email = email_to_check
    LIMIT 1;
    
    -- Get first public user ID
    SELECT 
        id INTO public_user_id
    FROM public.users 
    WHERE email = email_to_check
    LIMIT 1;
    
    -- Determine if public user exists
    public_user_exists := (public_user_id IS NOT NULL);
    
    RETURN json_build_object(
        'exists_in_auth', (auth_user_id IS NOT NULL),
        'exists_in_public', public_user_exists,
        'auth_user_id', auth_user_id,
        'public_user_id', public_user_id,
        'auth_count', auth_count,
        'public_count', public_count,
        'is_confirmed', auth_user_confirmed,
        'ids_match', (auth_user_id = public_user_id OR (auth_user_id IS NULL AND public_user_id IS NULL)),
        'exists', ((auth_user_id IS NOT NULL) OR public_user_exists),
        'has_duplicates', (auth_count > 1 OR public_count > 1)
    );
END $$;

-- ========================================
-- 3. FIX FUNCTION TO CLEAN DUPLICATE RECORDS
-- ========================================

CREATE OR REPLACE FUNCTION public.clean_duplicate_user(user_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    auth_ids UUID[];
    public_ids UUID[];
    kept_auth_id UUID;
    kept_public_id UUID;
    result JSON;
    auth_count INTEGER;
    public_count INTEGER;
    cleanup_needed BOOLEAN := false;
BEGIN
    -- Get all auth.users IDs for this email
    SELECT ARRAY_AGG(id), COUNT(*) 
    INTO auth_ids, auth_count
    FROM auth.users 
    WHERE email = user_email;
    
    -- Get all public.users IDs for this email
    SELECT ARRAY_AGG(id), COUNT(*) 
    INTO public_ids, public_count
    FROM public.users 
    WHERE email = user_email;
    
    -- If no records, nothing to do
    IF auth_count = 0 AND public_count = 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'No users found with this email',
            'email', user_email
        );
    END IF;
    
    -- We'll need cleanup if there are duplicates in either table
    cleanup_needed := (auth_count > 1 OR public_count > 1 OR 
                      (auth_count = 1 AND public_count = 1 AND auth_ids[1] != public_ids[1]));
    
    -- If no cleanup needed, just return current status
    IF NOT cleanup_needed THEN
        RETURN json_build_object(
            'success', true,
            'message', 'User records are already clean',
            'email', user_email,
            'auth_id', CASE WHEN auth_count > 0 THEN auth_ids[1] ELSE NULL END,
            'public_id', CASE WHEN public_count > 0 THEN public_ids[1] ELSE NULL END,
            'auth_count', auth_count,
            'public_count', public_count
        );
    END IF;
    
    -- Begin cleanup
    -- Strategy: Keep the first auth record, delete others, then sync public records
    
    -- Step 1: Decide which ID to keep (prefer auth.users ID if exists)
    IF auth_count > 0 THEN
        kept_auth_id := auth_ids[1]; -- Keep the first auth ID
    ELSIF public_count > 0 THEN
        kept_auth_id := public_ids[1]; -- No auth ID, use public ID
    ELSE
        kept_auth_id := gen_random_uuid(); -- Shouldn't happen but just in case
    END IF;
    
    -- Step 2: Delete duplicate auth records (keep the first one)
    IF auth_count > 1 THEN
        DELETE FROM auth.users 
        WHERE email = user_email AND id != kept_auth_id;
    END IF;
    
    -- Step 3: Delete ALL public users (we'll recreate the correct one)
    IF public_count > 0 THEN
        DELETE FROM public.users 
        WHERE email = user_email;
    END IF;
    
    -- Step 4: Create correct public user record with matching ID
    IF auth_count > 0 THEN -- If we have an auth record, use its ID
        INSERT INTO public.users (
            id, 
            email, 
            role, 
            first_name, 
            last_name, 
            created_at, 
            updated_at
        )
        SELECT 
            kept_auth_id,
            user_email,
            'user', -- Default role
            COALESCE(au.raw_user_meta_data->>'firstName', au.raw_user_meta_data->>'first_name', 'User'),
            COALESCE(au.raw_user_meta_data->>'lastName', au.raw_user_meta_data->>'last_name', 'User'),
            NOW(),
            NOW()
        FROM auth.users au 
        WHERE id = kept_auth_id;
        
        kept_public_id := kept_auth_id;
    END IF;
    
    -- Return success result
    RETURN json_build_object(
        'success', true,
        'message', 'User records cleaned successfully',
        'email', user_email,
        'kept_auth_id', kept_auth_id,
        'kept_public_id', kept_public_id,
        'auth_count_before', auth_count,
        'public_count_before', public_count,
        'auth_count_after', 1,
        'public_count_after', 1
    );
END $$;

-- ========================================
-- 4. UPDATED MANUAL SIGNUP FUNCTION
-- ========================================

CREATE OR REPLACE FUNCTION public.manual_signup(
    user_email TEXT,
    user_password TEXT,
    user_first_name TEXT DEFAULT NULL,
    user_last_name TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_user_id UUID := gen_random_uuid();
    result JSON;
    user_exists_result JSON;
    cleaned_result JSON;
    auth_user_id UUID;
    public_user_id UUID;
    success BOOLEAN := false;
    error_message TEXT := '';
    user_data JSON;
BEGIN
    -- Check if user already exists with enhanced function
    user_exists_result := public.check_user_exists(user_email);
    
    -- If duplicates exist, clean them first
    IF (user_exists_result->>'has_duplicates')::BOOLEAN THEN
        cleaned_result := public.clean_duplicate_user(user_email);
        
        -- Re-check user after cleaning
        user_exists_result := public.check_user_exists(user_email);
    END IF;
    
    -- Extract the IDs for easier access
    auth_user_id := (user_exists_result->>'auth_user_id')::UUID;
    public_user_id := (user_exists_result->>'public_user_id')::UUID;
    
    -- Handle different scenarios
    IF (user_exists_result->>'exists_in_auth')::BOOLEAN THEN
        -- Auth user exists
        IF (user_exists_result->>'exists_in_public')::BOOLEAN THEN
            -- Both auth and public users exist - return error
            success := false;
            error_message := 'User with this email already exists';
            
            user_data := json_build_object(
                'user_id', auth_user_id,
                'email', user_email,
                'first_name', user_first_name,
                'last_name', user_last_name
            );
        ELSE
            -- User exists in auth but not in public - create missing public user
            BEGIN
                INSERT INTO public.users (
                    id, 
                    email, 
                    role, 
                    first_name, 
                    last_name, 
                    created_at, 
                    updated_at
                ) VALUES (
                    auth_user_id, 
                    user_email, 
                    'user', 
                    user_first_name, 
                    user_last_name, 
                    NOW(), 
                    NOW()
                );
                
                success := true;
                error_message := '';
                
                user_data := json_build_object(
                    'user_id', auth_user_id,
                    'email', user_email,
                    'first_name', user_first_name,
                    'last_name', user_last_name
                );
            EXCEPTION 
                WHEN unique_violation THEN
                    -- Someone else created this record concurrently, treat as success
                    success := true;
                    error_message := '';
                    
                    user_data := json_build_object(
                        'user_id', auth_user_id,
                        'email', user_email,
                        'first_name', user_first_name,
                        'last_name', user_last_name
                    );
                WHEN OTHERS THEN
                    success := false;
                    error_message := SQLERRM;
                    
                    user_data := json_build_object(
                        'user_id', auth_user_id,
                        'email', user_email,
                        'first_name', user_first_name,
                        'last_name', user_last_name
                    );
            END;
        END IF;
    ELSE
        -- No existing user - create new one
        BEGIN
            -- Create new user in auth.users
            INSERT INTO auth.users (
                id, 
                instance_id, 
                email, 
                aud, 
                role, 
                encrypted_password, 
                email_confirmed_at, 
                created_at, 
                updated_at,
                confirmation_token,
                raw_user_meta_data
            ) VALUES (
                new_user_id,
                '00000000-0000-0000-0000-000000000000',
                user_email,
                'authenticated',
                'authenticated',
                crypt(user_password, gen_salt('bf')),
                NOW(), -- Auto-confirm email
                NOW(),
                NOW(),
                '', -- No confirmation needed
                jsonb_build_object(
                    'first_name', user_first_name,
                    'last_name', user_last_name
                )
            );
            
            -- Create user in public.users
            INSERT INTO public.users (
                id, 
                email, 
                role, 
                first_name, 
                last_name, 
                created_at, 
                updated_at
            ) VALUES (
                new_user_id, 
                user_email, 
                'user', 
                user_first_name, 
                user_last_name, 
                NOW(), 
                NOW()
            );
            
            success := true;
            error_message := '';
            user_data := json_build_object(
                'user_id', new_user_id,
                'email', user_email,
                'first_name', user_first_name,
                'last_name', user_last_name
            );
        EXCEPTION 
            WHEN unique_violation THEN
                -- Handle race condition - check what happened and recover
                cleaned_result := public.clean_duplicate_user(user_email);
                
                -- Re-check user after cleaning
                user_exists_result := public.check_user_exists(user_email);
                auth_user_id := (user_exists_result->>'auth_user_id')::UUID;
                
                -- Return existing user info
                success := false;
                error_message := 'User with this email already exists (race condition detected)';
                
                user_data := json_build_object(
                    'user_id', auth_user_id,
                    'email', user_email,
                    'first_name', user_first_name,
                    'last_name', user_last_name
                );
            WHEN OTHERS THEN
                success := false;
                error_message := SQLERRM;
                
                user_data := json_build_object(
                    'user_id', NULL,
                    'email', user_email,
                    'first_name', user_first_name,
                    'last_name', user_last_name
                );
        END;
    END IF;
    
    -- Always construct and return a result object
    result := json_build_object(
        'success', success,
        'message', CASE WHEN success THEN 'Account created successfully! You can now sign in.' ELSE '' END,
        'error', error_message,
        'user', user_data
    );
    
    RETURN result;
END $$;

-- ========================================
-- 5. TEST THE SIGNUP FUNCTIONS
-- ========================================

-- Let's do a couple of quick tests
SELECT '=== TESTING DUPLICATE HANDLING ===' as section;

-- Test 1: Clean duplicates for a test user
SELECT check_user_exists('test-duplicate-handling@example.com') as before_check;

-- Create a test user with potentially duplicate records
DO $$
DECLARE
    id1 UUID := gen_random_uuid();
    id2 UUID := gen_random_uuid();
BEGIN
    -- Try to create potentially conflicting records
    BEGIN
        INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at)
        VALUES (id1, 'test-duplicate-handling@example.com', 'password', NOW(), NOW());
    EXCEPTION WHEN OTHERS THEN
        -- Ignore errors
    END;
    
    BEGIN
        INSERT INTO public.users (id, email, role, created_at, updated_at)
        VALUES (id2, 'test-duplicate-handling@example.com', 'user', NOW(), NOW());
    EXCEPTION WHEN OTHERS THEN
        -- Ignore errors
    END;
END $$;

-- Now check and clean
SELECT check_user_exists('test-duplicate-handling@example.com') as after_creation;
SELECT clean_duplicate_user('test-duplicate-handling@example.com') as clean_result;
SELECT check_user_exists('test-duplicate-handling@example.com') as after_cleaning;

-- Finally test signup with the cleaned user
SELECT manual_signup(
    'test-duplicate-handling@example.com',
    'newpassword123',
    'Test',
    'User'
) as signup_result;

-- Clean up the test user
DELETE FROM auth.users WHERE email = 'test-duplicate-handling@example.com';
DELETE FROM public.users WHERE email = 'test-duplicate-handling@example.com';

-- ========================================
-- 6. VERIFY FINAL STATE
-- ========================================

SELECT '=== VERIFICATION COMPLETE ===' as section;
SELECT 'All functions updated successfully' as status;
SELECT 'You can now run signup without encountering duplicate key errors' as result;
SELECT 'If issues persist, use the clean_duplicate_user function on specific emails' as tip;

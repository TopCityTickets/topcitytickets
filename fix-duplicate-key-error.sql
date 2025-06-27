-- FIX DUPLICATE KEY CONSTRAINT ERROR
-- This SQL script improves the manual_signup function to better handle duplicate keys
-- Run this in Supabase SQL Editor

-- First, let's create an improved check_user_exists function that provides more details
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
BEGIN
    -- Check in auth.users and get more details
    SELECT 
        id, 
        email_confirmed_at IS NOT NULL INTO auth_user_id, auth_user_confirmed
    FROM auth.users 
    WHERE email = email_to_check;
    
    -- Check in public.users
    SELECT 
        id INTO public_user_id
    FROM public.users 
    WHERE email = email_to_check;
    
    -- Determine if public user exists
    public_user_exists := (public_user_id IS NOT NULL);
    
    RETURN json_build_object(
        'exists_in_auth', (auth_user_id IS NOT NULL),
        'exists_in_public', public_user_exists,
        'auth_user_id', auth_user_id,
        'public_user_id', public_user_id,
        'is_confirmed', auth_user_confirmed,
        'ids_match', (auth_user_id = public_user_id OR (auth_user_id IS NULL AND public_user_id IS NULL)),
        'exists', ((auth_user_id IS NOT NULL) OR public_user_exists)
    );
END $$;

-- Now update the manual_signup function to handle duplicate key errors
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
    existing_auth_user_id UUID;
    existing_public_user_id UUID;
    success BOOLEAN := false;
    error_message TEXT := '';
    user_data JSON;
    user_exists_result JSON;
BEGIN
    -- Check if user already exists with our enhanced function
    user_exists_result := public.check_user_exists(user_email);
    
    -- Extract the IDs for easier access
    existing_auth_user_id := (user_exists_result->>'auth_user_id')::UUID;
    existing_public_user_id := (user_exists_result->>'public_user_id')::UUID;
    
    -- Handle different scenarios
    IF (user_exists_result->>'exists_in_auth')::BOOLEAN THEN
        -- Auth user exists
        IF (user_exists_result->>'exists_in_public')::BOOLEAN THEN
            -- Both auth and public users exist - return error
            success := false;
            error_message := 'User with this email already exists';
            
            -- Use existing IDs for user_data to avoid NULL value
            user_data := json_build_object(
                'user_id', existing_auth_user_id,
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
                    existing_auth_user_id, 
                    user_email, 
                    'user', 
                    user_first_name, 
                    user_last_name, 
                    NOW(), 
                    NOW()
                );
                
                success := true;
                error_message := '';
                
                -- Use existing auth ID
                user_data := json_build_object(
                    'user_id', existing_auth_user_id,
                    'email', user_email,
                    'first_name', user_first_name,
                    'last_name', user_last_name
                );
            EXCEPTION 
                WHEN unique_violation THEN
                    -- Someone else tried to fix this at the same time
                    success := true;
                    error_message := '';
                    
                    user_data := json_build_object(
                        'user_id', existing_auth_user_id,
                        'email', user_email,
                        'first_name', user_first_name,
                        'last_name', user_last_name
                    );
                WHEN OTHERS THEN
                    success := false;
                    error_message := SQLERRM;
                    
                    user_data := json_build_object(
                        'user_id', existing_auth_user_id,
                        'email', user_email,
                        'first_name', user_first_name,
                        'last_name', user_last_name
                    );
            END;
        END IF;
    ELSE
        -- Auth user doesn't exist
        IF (user_exists_result->>'exists_in_public')::BOOLEAN THEN
            -- This is a strange case - public user exists but auth user doesn't
            -- Delete the public user and create both
            DELETE FROM public.users WHERE id = existing_public_user_id;
        END IF;
        
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
                confirmation_token
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
                '' -- No confirmation needed
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
                -- Handle rare race condition where user was created between our check and insert
                -- Try to fetch the existing user
                SELECT id INTO existing_auth_user_id FROM auth.users WHERE email = user_email;
                
                IF existing_auth_user_id IS NOT NULL THEN
                    -- User already exists, return error
                    success := false;
                    error_message := 'User with this email already exists (race condition)';
                    
                    user_data := json_build_object(
                        'user_id', existing_auth_user_id,
                        'email', user_email,
                        'first_name', user_first_name,
                        'last_name', user_last_name
                    );
                ELSE
                    -- Something unusual happened
                    success := false;
                    error_message := 'Unique constraint violation, but user not found';
                    
                    user_data := json_build_object(
                        'user_id', NULL,
                        'email', user_email,
                        'first_name', user_first_name,
                        'last_name', user_last_name
                    );
                END IF;
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

-- Test the function by attempting to create a duplicate user
SELECT manual_signup('test_duplicate@example.com', 'password123', 'Test', 'User');
SELECT manual_signup('test_duplicate@example.com', 'password123', 'Test', 'User');

-- Test with existing user recovery scenario
SELECT manual_signup('test_recovery@example.com', 'password123', 'Test', 'User');
-- Delete just the public user to simulate a broken registration
DELETE FROM public.users WHERE email = 'test_recovery@example.com';
-- Now try to register again - should recover by creating missing public user
SELECT manual_signup('test_recovery@example.com', 'password123', 'Test', 'User');

-- Clean up test users
DELETE FROM auth.users WHERE email IN ('test_duplicate@example.com', 'test_recovery@example.com');
DELETE FROM public.users WHERE email IN ('test_duplicate@example.com', 'test_recovery@example.com');

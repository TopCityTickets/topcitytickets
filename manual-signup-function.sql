-- CREATE MANUAL SIGNUP API FUNCTION
-- This bypasses the broken Supabase auth.signUp() completely
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.manual_signup(
    user_email TEXT,
    user_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_user_id UUID := gen_random_uuid();
    result JSON;
    existing_user_count INTEGER;
BEGIN
    -- Check if user already exists
    SELECT COUNT(*) INTO existing_user_count 
    FROM auth.users 
    WHERE email = user_email;
    
    IF existing_user_count > 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User with this email already exists'
        );
    END IF;
    
    -- Create user in auth.users
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
    INSERT INTO public.users (id, email, role, created_at, updated_at)
    VALUES (new_user_id, user_email, 'user', NOW(), NOW());
    
    -- Return success
    result := json_build_object(
        'success', true,
        'user_id', new_user_id,
        'email', user_email,
        'message', 'Account created successfully! You can now sign in.'
    );
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END $$;

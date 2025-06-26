-- FIX DUPLICATE USER ERROR
-- This fixes the "duplicate key value violates unique constraint users_pkey" error
-- by checking if a user exists in both auth.users AND public.users tables

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
    existing_public_user_count INTEGER;
BEGIN
    -- Check if user already exists in auth.users
    SELECT id INTO existing_auth_user_id 
    FROM auth.users 
    WHERE email = user_email;
    
    -- Check if user exists in public.users
    SELECT COUNT(*) INTO existing_public_user_count 
    FROM public.users 
    WHERE email = user_email;
    
    -- Handle different scenarios
    IF existing_auth_user_id IS NOT NULL THEN
        -- Auth user exists
        IF existing_public_user_count > 0 THEN
            -- Both auth and public users exist - return error
            RETURN json_build_object(
                'success', false,
                'error', 'User with this email already exists'
            );
        ELSE
            -- User exists in auth but not in public - create missing public user
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
            
            RETURN json_build_object(
                'success', true,
                'user_id', existing_auth_user_id,
                'email', user_email,
                'first_name', user_first_name,
                'last_name', user_last_name,
                'message', 'Account completed successfully! You can now sign in.'
            );
        END IF;
    ELSE
        -- Auth user doesn't exist
        IF existing_public_user_count > 0 THEN
            -- This is a strange case - public user exists but auth user doesn't
            -- Delete the public user and create both
            DELETE FROM public.users WHERE email = user_email;
        END IF;
        
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
        
        -- Return success
        result := json_build_object(
            'success', true,
            'user_id', new_user_id,
            'email', user_email,
            'first_name', user_first_name,
            'last_name', user_last_name,
            'message', 'Account created successfully! You can now sign in.'
        );
        
        RETURN result;
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END $$;

-- Add a function to check if user exists
CREATE OR REPLACE FUNCTION public.check_user_exists(email_to_check TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    auth_user_id UUID;
    public_user_id UUID;
BEGIN
    -- Check auth.users
    SELECT id INTO auth_user_id FROM auth.users WHERE email = email_to_check;
    
    -- Check public.users
    SELECT id INTO public_user_id FROM public.users WHERE email = email_to_check;
    
    RETURN json_build_object(
        'email', email_to_check,
        'exists_in_auth', auth_user_id IS NOT NULL,
        'exists_in_public', public_user_id IS NOT NULL,
        'auth_user_id', auth_user_id,
        'public_user_id', public_user_id
    );
END $$;

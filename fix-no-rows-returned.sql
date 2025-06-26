-- FIX "SUCCESS NO ROWS RETURNED" ERROR
-- Modify the manual_signup function to always return data

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
    success BOOLEAN := false;
    error_message TEXT := '';
    user_data JSON;
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
            success := false;
            error_message := 'User with this email already exists';
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
            EXCEPTION WHEN OTHERS THEN
                success := false;
                error_message := SQLERRM;
            END;
        END IF;
        
        -- Return existing user's ID regardless
        user_data := json_build_object(
            'user_id', existing_auth_user_id,
            'email', user_email,
            'first_name', user_first_name,
            'last_name', user_last_name
        );
    ELSE
        -- Auth user doesn't exist
        IF existing_public_user_count > 0 THEN
            -- This is a strange case - public user exists but auth user doesn't
            -- Delete the public user and create both
            DELETE FROM public.users WHERE email = user_email;
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
        EXCEPTION WHEN OTHERS THEN
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

-- Test the function directly with explicit return
SELECT manual_signup('test@example.com', 'password123', 'Test', 'User');

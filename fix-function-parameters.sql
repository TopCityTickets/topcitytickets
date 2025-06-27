-- Quick fix for function parameter error
-- Run this to fix the "cannot remove parameter defaults" error

BEGIN;

-- Drop existing functions that might have parameter conflicts
DROP FUNCTION IF EXISTS public.manual_signup(text, text, text, text);
DROP FUNCTION IF EXISTS public.check_user_exists(text);
DROP FUNCTION IF EXISTS public.clean_duplicate_user(text);

-- Recreate manual_signup function with proper signature
CREATE FUNCTION public.manual_signup(
    user_email TEXT,
    user_password TEXT,
    user_first_name TEXT,
    user_last_name TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_id UUID;
    result RECORD;
BEGIN
    -- Validation
    IF user_email IS NULL OR user_email = '' THEN
        RETURN json_build_object('success', false, 'error', 'Email is required');
    END IF;
    
    IF user_password IS NULL OR user_password = '' OR LENGTH(user_password) < 6 THEN
        RETURN json_build_object('success', false, 'error', 'Password must be at least 6 characters');
    END IF;
    
    IF user_first_name IS NULL OR user_first_name = '' THEN
        RETURN json_build_object('success', false, 'error', 'First name is required');
    END IF;
    
    IF user_last_name IS NULL OR user_last_name = '' THEN
        RETURN json_build_object('success', false, 'error', 'Last name is required');
    END IF;

    -- Check if user already exists
    SELECT id INTO user_id FROM auth.users WHERE email = user_email LIMIT 1;
    
    -- If user exists, return error
    IF user_id IS NOT NULL THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'An account with this email already exists. Please log in instead.'
        );
    END IF;
    
    -- Create user in auth.users
    user_id := gen_random_uuid();
    
    INSERT INTO auth.users (
        id,
        email,
        encrypted_password,
        raw_user_meta_data,
        created_at,
        updated_at,
        email_confirmed_at
    )
    VALUES (
        user_id,
        user_email,
        crypt(user_password, gen_salt('bf')),
        jsonb_build_object(
            'first_name', user_first_name,
            'last_name', user_last_name
        ),
        now(),
        now(),
        now() -- Auto-confirm email
    );
    
    -- Create corresponding public.users entry
    INSERT INTO public.users (
        id,
        email,
        role,
        first_name,
        last_name,
        created_at
    )
    VALUES (
        user_id,
        user_email,
        'user',
        user_first_name,
        user_last_name,
        now()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        updated_at = now();
    
    -- Return success with user info
    RETURN json_build_object(
        'success', true,
        'message', 'User created successfully',
        'user', json_build_object(
            'user_id', user_id,
            'email', user_email,
            'first_name', user_first_name,
            'last_name', user_last_name
        )
    );
    
EXCEPTION WHEN others THEN
    -- Return any errors
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;

-- Recreate check_user_exists function
CREATE FUNCTION public.check_user_exists(email_to_check TEXT)
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

COMMIT;

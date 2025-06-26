-- FINAL SCHEMA VERIFICATION AND FUNCTION UPDATE
-- This ensures our manual_signup function exactly matches the provided schema

-- Update the manual_signup function to match the exact schema provided
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
    
    -- Create user in public.users matching the exact schema
    -- Using the user_role enum value 'user' as default
    INSERT INTO public.users (
        id, 
        email, 
        first_name, 
        last_name, 
        role,
        created_at, 
        updated_at
    ) VALUES (
        new_user_id, 
        user_email, 
        user_first_name, 
        user_last_name, 
        'user'::user_role,  -- Explicitly cast to the enum type
        NOW(), 
        NOW()
    );
    
    -- Return success with all details
    result := json_build_object(
        'success', true,
        'user_id', new_user_id,
        'email', user_email,
        'first_name', user_first_name,
        'last_name', user_last_name,
        'message', 'Account created successfully! You can now sign in.'
    );
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END $$;

-- Verify the schema matches what we expect
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- Check the user_role enum values
SELECT 
    e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'user_role'
ORDER BY e.enumsortorder;

SELECT 'Schema verification complete. Function updated to match exact schema.' as status;

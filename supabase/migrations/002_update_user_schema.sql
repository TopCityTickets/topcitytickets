-- Migration: Update User Schema
-- This migration adds first_name and last_name to users table and ensures proper constraints

-- Make sure both auth and public schemas are accessible
BEGIN;

-- 1. Update public.users table to ensure it has first_name and last_name columns
DO $$ 
BEGIN
    -- Add first_name if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'first_name'
    ) THEN
        ALTER TABLE public.users ADD COLUMN first_name TEXT;
    END IF;

    -- Add last_name if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'last_name'
    ) THEN
        ALTER TABLE public.users ADD COLUMN last_name TEXT;
    END IF;
    
    -- Add updated_at if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.users ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
    END IF;
END $$;

-- 2. Ensure public.users has the correct structure and constraints
ALTER TABLE public.users ALTER COLUMN id SET NOT NULL;
ALTER TABLE public.users ALTER COLUMN email SET NOT NULL;
ALTER TABLE public.users ALTER COLUMN role SET NOT NULL;
ALTER TABLE public.users ALTER COLUMN created_at SET DEFAULT now();

-- 3. Make sure foreign key to auth.users exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'users_id_fkey' 
        AND table_schema = 'public' 
        AND table_name = 'users'
    ) THEN
        -- Add foreign key if it doesn't exist
        ALTER TABLE public.users
        ADD CONSTRAINT users_id_fkey
        FOREIGN KEY (id)
        REFERENCES auth.users(id)
        ON DELETE CASCADE;
    END IF;
END $$;

-- 4. Create or update trigger to auto-create public.users entry when auth.users is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, role, first_name, last_name, created_at)
    VALUES (
        NEW.id,
        NEW.email,
        'user',
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        NEW.created_at
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        first_name = COALESCE(EXCLUDED.first_name, public.users.first_name),
        last_name = COALESCE(EXCLUDED.last_name, public.users.last_name),
        updated_at = now();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Create or update the manual signup function to match our schema
CREATE OR REPLACE FUNCTION public.manual_signup(
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
    )
    RETURNING * INTO result;
    
    -- The trigger will automatically create the public.users entry
    -- But to be safe, let's check and create it if needed
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = user_id) THEN
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
        );
    END IF;
    
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

-- 6. Create or update check_user_exists function
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

COMMIT;

-- STEP-BY-STEP MIGRATION: Add new columns to existing users table
-- Run this first to add the missing columns

BEGIN;

-- 1. Add missing columns to existing users table
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

    -- Add is_anonymous if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'is_anonymous'
    ) THEN
        ALTER TABLE public.users ADD COLUMN is_anonymous BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add seller_status if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'seller_status'
    ) THEN
        ALTER TABLE public.users ADD COLUMN seller_status TEXT DEFAULT NULL;
        -- Add check constraint
        ALTER TABLE public.users ADD CONSTRAINT users_seller_status_check 
        CHECK (seller_status IN (NULL, 'pending', 'approved', 'denied'));
    END IF;

    -- Add seller_applied_at if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'seller_applied_at'
    ) THEN
        ALTER TABLE public.users ADD COLUMN seller_applied_at TIMESTAMPTZ;
    END IF;

    -- Add seller_approved_at if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'seller_approved_at'
    ) THEN
        ALTER TABLE public.users ADD COLUMN seller_approved_at TIMESTAMPTZ;
    END IF;

    -- Add seller_denied_at if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'seller_denied_at'
    ) THEN
        ALTER TABLE public.users ADD COLUMN seller_denied_at TIMESTAMPTZ;
    END IF;

    -- Add can_reapply_at if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'can_reapply_at'
    ) THEN
        ALTER TABLE public.users ADD COLUMN can_reapply_at TIMESTAMPTZ;
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

-- 2. Update role constraint to include new roles
DO $$
BEGIN
    -- Drop existing role constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'users_role_check' 
        AND table_schema = 'public' 
        AND table_name = 'users'
    ) THEN
        ALTER TABLE public.users DROP CONSTRAINT users_role_check;
    END IF;
    
    -- Add updated role constraint
    ALTER TABLE public.users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('user', 'seller', 'admin'));
END $$;

-- 3. Ensure updated_at trigger exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

COMMIT;

-- Display current users table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

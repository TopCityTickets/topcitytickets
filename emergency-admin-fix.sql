-- EMERGENCY ADMIN FIX - Run this in Supabase SQL Editor
-- This will force your admin account to work properly

-- 1. First check what we have
SELECT 'Current auth users:' as info;
SELECT id, email, email_confirmed_at FROM auth.users WHERE email = 'topcitytickets@gmail.com';

SELECT 'Current public users:' as info;
SELECT id, email, role FROM public.users WHERE email = 'topcitytickets@gmail.com';

-- 2. Make sure the auth user is confirmed (can login)
UPDATE auth.users 
SET 
  email_confirmed_at = NOW(),
  confirmation_token = '',
  updated_at = NOW()
WHERE email = 'topcitytickets@gmail.com';

-- 3. Force create/update the public.users record with admin role
-- Get the auth user ID first
DO $$
DECLARE
    auth_user_id UUID;
BEGIN
    -- Get the auth user ID
    SELECT id INTO auth_user_id FROM auth.users WHERE email = 'topcitytickets@gmail.com';
    
    IF auth_user_id IS NOT NULL THEN
        -- Delete any existing record first
        DELETE FROM public.users WHERE id = auth_user_id OR email = 'topcitytickets@gmail.com';
        
        -- Insert fresh admin record
        INSERT INTO public.users (id, email, role, created_at, updated_at)
        VALUES (auth_user_id, 'topcitytickets@gmail.com', 'admin', NOW(), NOW());
        
        RAISE NOTICE 'Admin user created with ID: %', auth_user_id;
    ELSE
        RAISE EXCEPTION 'Auth user not found for topcitytickets@gmail.com';
    END IF;
END $$;

-- 4. Also set up in user_roles table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles') THEN
        -- Delete existing role
        DELETE FROM public.user_roles WHERE user_id = (
            SELECT id FROM auth.users WHERE email = 'topcitytickets@gmail.com'
        );
        
        -- Insert admin role
        INSERT INTO public.user_roles (user_id, role)
        SELECT id, 'admin'
        FROM auth.users 
        WHERE email = 'topcitytickets@gmail.com';
        
        RAISE NOTICE 'User role set in user_roles table';
    ELSE
        RAISE NOTICE 'user_roles table does not exist, skipping';
    END IF;
END $$;

-- 5. Verify everything is set up correctly
SELECT 'FINAL VERIFICATION:' as status;
SELECT 
  au.id,
  au.email,
  au.email_confirmed_at IS NOT NULL as can_login,
  pu.role as public_role
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'topcitytickets@gmail.com';

-- Also check user_roles table separately if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles') THEN
        RAISE NOTICE 'Checking user_roles table...';
        PERFORM 1 FROM public.user_roles WHERE user_id = (
            SELECT id FROM auth.users WHERE email = 'topcitytickets@gmail.com'
        );
        IF FOUND THEN
            RAISE NOTICE 'User found in user_roles table';
        ELSE
            RAISE NOTICE 'User NOT found in user_roles table';
        END IF;
    ELSE
        RAISE NOTICE 'user_roles table does not exist';
    END IF;
END $$;

SELECT 'SUCCESS! Your admin account is now ready. Try logging in.' as result;

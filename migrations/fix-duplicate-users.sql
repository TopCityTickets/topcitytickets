-- FIX: Resolve duplicate key constraint in users table

BEGIN;

-- Step 1: Identify and remove duplicate users (keep the oldest one)
WITH duplicate_users AS (
    SELECT id, 
           ROW_NUMBER() OVER (PARTITION BY id ORDER BY created_at ASC) as rn
    FROM public.users
)
DELETE FROM public.users 
WHERE id IN (
    SELECT id FROM duplicate_users WHERE rn > 1
);

-- Step 2: Sync missing users from auth.users to public.users
INSERT INTO public.users (
    id, 
    email, 
    role, 
    created_at, 
    updated_at
)
SELECT 
    au.id,
    au.email,
    'customer' as role,
    au.created_at,
    now() as updated_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Step 3: Clean up any users in public.users that don't exist in auth.users
DELETE FROM public.users 
WHERE id NOT IN (SELECT id FROM auth.users);

-- Step 4: Ensure all required columns have default values
UPDATE public.users 
SET 
    role = COALESCE(role, 'customer'),
    seller_status = COALESCE(seller_status, 'none'),
    updated_at = COALESCE(updated_at, now())
WHERE role IS NULL 
   OR seller_status IS NULL 
   OR updated_at IS NULL;

COMMIT;

-- Verification query
SELECT 'FIXED - User sync completed' as status;

SELECT 
    'Final counts' as check_type,
    (SELECT count(*) FROM auth.users) as auth_users,
    (SELECT count(*) FROM public.users) as public_users,
    (SELECT count(*) FROM auth.users au LEFT JOIN public.users pu ON au.id = pu.id WHERE pu.id IS NULL) as missing_in_public;

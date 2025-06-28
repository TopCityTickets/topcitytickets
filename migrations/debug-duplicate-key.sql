-- DIAGNOSTIC: Check for duplicate key issues in users table

-- 1. Check if there are duplicate IDs in public.users
SELECT 
    id, 
    email, 
    count(*) as duplicate_count
FROM public.users 
GROUP BY id, email 
HAVING count(*) > 1;

-- 2. Check for users in auth.users that don't exist in public.users
SELECT 
    'Auth users not in public.users' as issue,
    count(*) as count
FROM auth.users au 
LEFT JOIN public.users pu ON au.id = pu.id 
WHERE pu.id IS NULL;

-- 3. Check for users in public.users that don't exist in auth.users
SELECT 
    'Public users not in auth.users' as issue,
    count(*) as count
FROM public.users pu 
LEFT JOIN auth.users au ON pu.id = au.id 
WHERE au.id IS NULL;

-- 4. Check the current user counts
SELECT 'auth.users count' as table_name, count(*) as count FROM auth.users
UNION ALL
SELECT 'public.users count' as table_name, count(*) as count FROM public.users;

-- 5. Show the actual duplicate IDs if any
SELECT 
    id,
    email,
    created_at,
    'Duplicate in public.users' as issue
FROM public.users 
WHERE id IN (
    SELECT id 
    FROM public.users 
    GROUP BY id 
    HAVING count(*) > 1
)
ORDER BY id, created_at;

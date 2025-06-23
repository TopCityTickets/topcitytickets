-- Check if trigger exists and is enabled
SELECT 
    trigger_name, 
    event_manipulation, 
    action_timing, 
    action_statement,
    trigger_schema,
    table_name
FROM information_schema.triggers 
WHERE table_name = 'users' AND table_schema = 'auth';

-- Check all users in auth.users
SELECT 
    id, 
    email, 
    email_confirmed_at,
    created_at,
    updated_at,
    last_sign_in_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;

-- Check all users in public.users
SELECT 
    id, 
    email, 
    role,
    created_at
FROM public.users 
ORDER BY created_at DESC 
LIMIT 10;

-- Check RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    hasrls
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';

-- Check if there are any auth.users without corresponding public.users
SELECT 
    a.id,
    a.email,
    a.email_confirmed_at,
    CASE WHEN p.id IS NULL THEN 'MISSING' ELSE 'EXISTS' END as public_user_status
FROM auth.users a
LEFT JOIN public.users p ON a.id = p.id
ORDER BY a.created_at DESC
LIMIT 10;

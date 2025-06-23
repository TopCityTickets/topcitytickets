-- Check if we have any auth.users that are confirmed but missing from public.users
-- First, let's see if we can get information about auth users using available functions

-- Check what functions we have available
SELECT 
    routine_name, 
    routine_type, 
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%user%'
ORDER BY routine_name;

-- Check if our trigger exists
SELECT 
    trigger_name, 
    event_manipulation, 
    action_timing, 
    action_statement
FROM information_schema.triggers 
WHERE table_name = 'users' 
AND table_schema = 'auth';

-- Check public.users table
SELECT 
    id, 
    email, 
    role,
    created_at
FROM public.users 
ORDER BY created_at DESC 
LIMIT 10;

-- Check if RLS is disabled on public.users
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'users' 
AND schemaname = 'public';

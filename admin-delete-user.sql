-- The most aggressive approach: Use Supabase admin functions
-- This bypasses all normal constraints and RLS

-- Step 1: Use the auth admin functions
SELECT auth.delete_user((
  SELECT id FROM auth.users WHERE email = 'topcitytickets@gmail.com'
));

-- Step 2: If that doesn't work, manually clean up
-- Force delete from storage objects if any exist
DELETE FROM storage.objects WHERE owner = (
  SELECT id FROM auth.users WHERE email = 'topcitytickets@gmail.com'
);

-- Force delete from all auth-related tables
DELETE FROM auth.refresh_tokens WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'topcitytickets@gmail.com'
);

DELETE FROM auth.sessions WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'topcitytickets@gmail.com'
);

-- Final nuclear option - direct table manipulation
DELETE FROM auth.users WHERE email = 'topcitytickets@gmail.com';
DELETE FROM public.users WHERE email = 'topcitytickets@gmail.com';

-- Verification
SELECT 
  'Complete elimination check:' as status,
  (SELECT COUNT(*) FROM auth.users WHERE email = 'topcitytickets@gmail.com') as auth_users,
  (SELECT COUNT(*) FROM public.users WHERE email = 'topcitytickets@gmail.com') as public_users,
  (SELECT COUNT(*) FROM auth.refresh_tokens WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'topcitytickets@gmail.com'
  )) as refresh_tokens,
  (SELECT COUNT(*) FROM auth.sessions WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'topcitytickets@gmail.com'
  )) as sessions;

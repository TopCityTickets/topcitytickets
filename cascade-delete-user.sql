-- Alternative: Use CASCADE delete with RLS temporarily disabled
-- This forces deletion even with constraints

-- Step 1: Temporarily disable RLS (might be blocking deletion)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;

-- Step 2: Get user ID for reference
DO $$
DECLARE
    user_uuid UUID;
BEGIN
    SELECT id INTO user_uuid FROM auth.users WHERE email = 'topcitytickets@gmail.com';
    
    IF user_uuid IS NOT NULL THEN        -- Delete everything related to this user
        DELETE FROM public.events WHERE user_id = user_uuid;
        DELETE FROM public.tickets WHERE user_id = user_uuid;
        DELETE FROM public.seller_applications WHERE user_id = user_uuid;
        DELETE FROM public.users WHERE id = user_uuid;
        
        -- Force delete from auth.users using admin privileges
        DELETE FROM auth.users WHERE id = user_uuid;
        
        RAISE NOTICE 'User deleted successfully: %', user_uuid;
    ELSE
        RAISE NOTICE 'User not found in auth.users';
    END IF;
END $$;

-- Step 3: Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Step 4: Verify deletion
SELECT 
  'Final check:' as status,
  COUNT(*) as remaining_records
FROM auth.users 
WHERE email = 'topcitytickets@gmail.com';

-- Create Custom Access Token Hook for Supabase
-- This SQL creates the PostgreSQL function that Supabase will call to add custom claims to JWT tokens

-- 1. First, create the custom access token hook function
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  claims jsonb;
  user_role text;
BEGIN
  -- Get the user ID from the event
  SELECT INTO user_role role
  FROM public.user_roles
  WHERE user_id = (event->>'user_id')::uuid;
  
  -- If no role found in user_roles table, check legacy users table
  IF user_role IS NULL THEN
    SELECT INTO user_role role
    FROM public.users
    WHERE id = (event->>'user_id')::uuid;
  END IF;
  
  -- Default to 'user' if no role found
  IF user_role IS NULL THEN
    user_role := 'user';
  END IF;

  -- Set the claims
  claims := event->'claims';
  claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));

  -- Update the 'claims' object in the original event
  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- 2. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO service_role;

-- 3. Grant read permissions on the tables the function needs
GRANT SELECT ON public.user_roles TO supabase_auth_admin;
GRANT SELECT ON public.users TO supabase_auth_admin;

SELECT 'Custom access token hook created successfully!' as result;

-- NEXT STEPS:
-- 1. Run this SQL in your Supabase SQL Editor
-- 2. Go to Supabase Dashboard > Authentication > Hooks
-- 3. Enable "Custom Access Token" hook
-- 4. Set the hook URL to: pg-functions://postgres/public/custom_access_token_hook
-- 5. Test by logging out and back in - your JWT should now contain user_role claim

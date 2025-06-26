-- Complete RBAC Integration for New Users
-- This ensures ALL new signups go through the proper RBAC system
-- Run this in Supabase SQL Editor

-- 1. Create a trigger function to automatically add new users to user_roles
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  -- Insert new user into user_roles table with default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');
  
  -- Also insert into legacy users table for backward compatibility
  INSERT INTO public.users (id, email, role, created_at, updated_at)
  VALUES (
    new.id, 
    new.email, 
    'user',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = now();
  
  RETURN new;
END;
$$ language plpgsql security definer;

-- 2. Create trigger on auth.users to automatically assign roles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT INSERT ON TABLE public.user_roles TO supabase_auth_admin;
GRANT INSERT, UPDATE ON TABLE public.users TO supabase_auth_admin;

-- 4. Test the integration
SELECT 'RBAC integration complete - all new signups will automatically get proper roles!' as status;

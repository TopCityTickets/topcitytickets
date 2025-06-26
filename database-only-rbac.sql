-- Database-Only RBAC Setup (No Custom Hooks Needed)
-- This approach works with Supabase Free Plan

-- 1. Check what enum types already exist
SELECT 
  t.typname as enum_name,
  string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as enum_values
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
GROUP BY t.typname
ORDER BY t.typname;

-- 2. Ensure tables use proper types - check current structure:
SELECT 
  table_name,
  column_name,
  data_type,
  udt_name
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'user_roles')
AND column_name = 'role'
ORDER BY table_name;

-- 3. Create trigger to auto-assign 'user' role on signup (using app_role)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert into users table
  INSERT INTO public.users (id, email, role)
  VALUES (new.id, new.email, 'user'::app_role)
  ON CONFLICT (id) DO UPDATE SET
    email = new.email;
  
  -- Insert into user_roles table (check if exists first)
  INSERT INTO public.user_roles (user_id, role)
  SELECT new.id, 'user'::app_role
  WHERE NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = new.id
  );
  
  RETURN new;
END;
$$ language plpgsql security definer;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Set up your admin account
-- First find your user:
SELECT 
  id,
  email,
  role as current_role
FROM public.users 
WHERE email = 'topcitytickets@gmail.com'
LIMIT 1;

-- Then make yourself admin (using app_role and safe insert):
-- Delete existing role first, then insert new one
DELETE FROM public.user_roles WHERE user_id = 'e70c6a6e-7838-4bcd-b2f4-c18c57a997c1';
INSERT INTO public.user_roles (user_id, role) 
VALUES ('e70c6a6e-7838-4bcd-b2f4-c18c57a997c1', 'admin'::app_role);

UPDATE public.users 
SET role = 'admin'::app_role 
WHERE id = 'e70c6a6e-7838-4bcd-b2f4-c18c57a997c1';

-- 5. Verify everything works
SELECT 'Database-only RBAC setup complete!' as result;
SELECT 'Remember to replace YOUR_EMAIL_HERE and YOUR_USER_ID_HERE in the commented sections above!' as reminder;

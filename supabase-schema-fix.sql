-- Supabase Database Fix for Role Assignment
-- Based on your actual schema structure

-- 1. Check your current enum types and table structures
SELECT 
  t.typname as enum_name,
  string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as enum_values
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
GROUP BY t.typname
ORDER BY t.typname;

-- 2. Check table structures
SELECT 
  table_name,
  column_name,
  data_type,
  udt_name,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'user_roles')
ORDER BY table_name, ordinal_position;

-- 3. Fix the users table trigger (using text type with CHECK constraint)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert into users table (using text type)
  INSERT INTO public.users (id, email, role)
  VALUES (new.id, new.email, 'user')
  ON CONFLICT (id) DO UPDATE SET
    email = new.email;
  
  -- Insert into user_roles table (determine the correct enum type first)
  -- This will work with whatever enum type you have
  INSERT INTO public.user_roles (user_id, role)
  SELECT new.id, enumval
  FROM (
    SELECT enumlabel::text as enumval
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname IN (
      SELECT udt_name 
      FROM information_schema.columns 
      WHERE table_name = 'user_roles' 
      AND column_name = 'role'
      AND table_schema = 'public'
    )
    AND enumlabel = 'user'
    LIMIT 1
  ) enum_val
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

-- 4. Set up your admin role (using text type for users table)
-- First find your user:
SELECT 
  id,
  email,
  role as current_role
FROM public.users 
WHERE email = 'topcitytickets@gmail.com'
LIMIT 1;

-- Update users table with text type
UPDATE public.users 
SET role = 'admin'
WHERE id = 'e70c6a6e-7838-4bcd-b2f4-c18c57a997c1';

-- For user_roles table, we need to find the correct enum type
-- Get the enum type name first
DO $$
DECLARE
    enum_type_name text;
    user_exists boolean;
BEGIN
    -- Get the enum type name used by user_roles.role column
    SELECT udt_name INTO enum_type_name
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_roles' 
    AND column_name = 'role';
    
    -- Check if user already has a role
    SELECT EXISTS(
        SELECT 1 FROM public.user_roles 
        WHERE user_id = 'e70c6a6e-7838-4bcd-b2f4-c18c57a997c1'
    ) INTO user_exists;
    
    -- Delete existing role if exists
    IF user_exists THEN
        DELETE FROM public.user_roles 
        WHERE user_id = 'e70c6a6e-7838-4bcd-b2f4-c18c57a997c1';
    END IF;
    
    -- Insert admin role using dynamic enum casting
    EXECUTE format('INSERT INTO public.user_roles (user_id, role) VALUES ($1, $2::%I)', enum_type_name)
    USING 'e70c6a6e-7838-4bcd-b2f4-c18c57a997c1', 'admin';
    
    RAISE NOTICE 'Admin role assigned using enum type: %', enum_type_name;
END $$;

-- 5. Check final result
SELECT 
  u.id,
  u.email,
  u.role as users_table_role,
  ur.role as user_roles_table_role
FROM public.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'topcitytickets@gmail.com';

SELECT 'Supabase RBAC setup complete with proper enum handling!' as result;

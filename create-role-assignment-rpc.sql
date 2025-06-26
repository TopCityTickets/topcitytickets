-- Create RPC Function for Safe Role Assignment
-- This handles the enum type casting properly

CREATE OR REPLACE FUNCTION public.assign_user_role(
  target_user_id uuid,
  new_role text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
        WHERE user_id = target_user_id
    ) INTO user_exists;
    
    -- Update or insert the role
    IF user_exists THEN
        -- Update existing role
        EXECUTE format('UPDATE public.user_roles SET role = $1::%I WHERE user_id = $2', enum_type_name)
        USING new_role, target_user_id;
    ELSE
        -- Insert new role
        EXECUTE format('INSERT INTO public.user_roles (user_id, role) VALUES ($1, $2::%I)', enum_type_name)
        USING target_user_id, new_role;
    END IF;
    
    -- Also update the users table
    UPDATE public.users 
    SET role = new_role 
    WHERE id = target_user_id;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.assign_user_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_user_role TO service_role;

SELECT 'RPC function assign_user_role created successfully!' as result;

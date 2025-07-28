-- Note: Vault extension not available, using environment variables for secrets
-- Secrets should be managed through Supabase dashboard or environment variables

-- Create role hierarchy table for better role management
CREATE TABLE IF NOT EXISTS public.roles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text UNIQUE NOT NULL CHECK (name IN ('user', 'seller', 'admin', 'super_admin')),
  permissions jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT NOW()
);

-- Insert default roles
INSERT INTO public.roles (name, permissions) VALUES
  ('user', '["view_events", "purchase_tickets"]'::jsonb),
  ('seller', '["view_events", "purchase_tickets", "create_events", "manage_own_events"]'::jsonb),
  ('admin', '["view_events", "purchase_tickets", "create_events", "manage_all_events", "manage_users"]'::jsonb),
  ('super_admin', '["all"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Update profiles table to reference roles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role_id uuid REFERENCES public.roles(id);

-- Create function to get user role with permissions
CREATE OR REPLACE FUNCTION public.get_user_role_permissions(user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_permissions jsonb;
BEGIN
  SELECT r.permissions INTO user_permissions
  FROM public.profiles p
  JOIN public.roles r ON p.role_id = r.id
  WHERE p.id = user_id;
  
  RETURN COALESCE(user_permissions, '[]'::jsonb);
END;
$$;

-- Create function to check if user has permission
CREATE OR REPLACE FUNCTION public.user_has_permission(user_id uuid, permission text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_permissions jsonb;
BEGIN
  user_permissions := public.get_user_role_permissions(user_id);
  
  -- Check for super admin (has "all" permission)
  IF user_permissions ? 'all' THEN
    RETURN true;
  END IF;
  
  -- Check for specific permission
  RETURN user_permissions ? permission;
END;
$$;

-- Update RLS policies to use the new permission system
DROP POLICY IF EXISTS "Sellers can create events" ON public.events;
DROP POLICY IF EXISTS "Sellers can update own events" ON public.events;
DROP POLICY IF EXISTS "Admins can view all events" ON public.events;
DROP POLICY IF EXISTS "Admins can update any event" ON public.events;

-- Enhanced RLS policies using permission functions
CREATE POLICY "Users with create_events permission can create events" ON public.events
  FOR INSERT WITH CHECK (
    public.user_has_permission(auth.uid(), 'create_events') AND
    auth.uid() = seller_id
  );

CREATE POLICY "Users can update own events with manage_own_events permission" ON public.events
  FOR UPDATE USING (
    auth.uid() = seller_id AND
    public.user_has_permission(auth.uid(), 'manage_own_events')
  );

CREATE POLICY "Users with manage_all_events can view all events" ON public.events
  FOR SELECT USING (
    status = 'active' OR
    auth.uid() = seller_id OR
    public.user_has_permission(auth.uid(), 'manage_all_events')
  );

CREATE POLICY "Users with manage_all_events can update any event" ON public.events
  FOR UPDATE USING (
    public.user_has_permission(auth.uid(), 'manage_all_events') OR
    (auth.uid() = seller_id AND public.user_has_permission(auth.uid(), 'manage_own_events'))
  );

-- Enable RLS on roles table
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- RLS policy for roles - only admins can view roles
CREATE POLICY "Only admins can manage roles" ON public.roles
  FOR ALL USING (
    public.user_has_permission(auth.uid(), 'manage_users') OR
    public.user_has_permission(auth.uid(), 'all')
  );

-- Grant necessary permissions
GRANT ALL ON public.roles TO authenticated, service_role;

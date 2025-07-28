-- Secrets management through environment variables
-- Add these to your .env.local file:
-- APP_SECRET_KEY=your-app-secret-key-here
-- STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key-here
-- WEBHOOK_SECRET=whsec_your-webhook-secret-here
-- ADMIN_EMAIL=admin@topcitytickets.com

-- Create admin user function
CREATE OR REPLACE FUNCTION public.promote_user_to_admin(user_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_role_id uuid;
  user_found boolean := false;
BEGIN
  -- Get admin role ID
  SELECT id INTO admin_role_id 
  FROM public.roles 
  WHERE name = 'admin';
  
  -- Update user to admin role
  UPDATE public.profiles 
  SET role_id = admin_role_id,
      role = 'admin'
  WHERE email = user_email;
  
  GET DIAGNOSTICS user_found = FOUND;
  
  RETURN user_found;
END;
$$;

-- Create seller application function
CREATE OR REPLACE FUNCTION public.apply_for_seller_role(
  user_id uuid,
  business_name text,
  business_type text,
  description text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  application_id uuid;
BEGIN
  -- Insert seller application
  INSERT INTO public.seller_applications (
    user_id,
    business_name,
    business_type,
    description,
    status
  ) VALUES (
    user_id,
    business_name,
    business_type,
    description,
    'pending'
  ) RETURNING id INTO application_id;
  
  RETURN application_id;
END;
$$;

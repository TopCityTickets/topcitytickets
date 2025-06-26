-- EXECUTE THIS IN SUPABASE SQL EDITOR
-- This function fixes duplicate user errors

-- Update the manual_signup function to check and handle existing users
CREATE OR REPLACE FUNCTION public.check_user_exists(email_to_check TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    auth_user_id UUID;
    public_user_id UUID;
BEGIN
    -- Check auth.users
    SELECT id INTO auth_user_id FROM auth.users WHERE email = email_to_check;
    
    -- Check public.users
    SELECT id INTO public_user_id FROM public.users WHERE email = email_to_check;
    
    RETURN json_build_object(
        'email', email_to_check,
        'exists_in_auth', auth_user_id IS NOT NULL,
        'exists_in_public', public_user_id IS NOT NULL,
        'auth_user_id', auth_user_id,
        'public_user_id', public_user_id
    );
END $$;

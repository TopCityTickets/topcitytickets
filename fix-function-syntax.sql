-- QUICK FIX: Function syntax error
-- Run this to fix the apply_for_seller function syntax error

BEGIN;

-- Drop and recreate the problematic function with correct variable naming
DROP FUNCTION IF EXISTS public.apply_for_seller(UUID);

-- Function to apply for seller status (fixed variable naming)
CREATE OR REPLACE FUNCTION public.apply_for_seller(user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record RECORD;
BEGIN
    -- Get current user info
    SELECT * INTO user_record FROM public.users WHERE id = user_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'User not found');
    END IF;
    
    -- Check if user is already a seller
    IF user_record.role = 'seller' THEN
        RETURN json_build_object('success', false, 'error', 'User is already a seller');
    END IF;
    
    -- Check if user has pending application
    IF user_record.seller_status = 'pending' THEN
        RETURN json_build_object('success', false, 'error', 'Seller application is already pending');
    END IF;
    
    -- Check if user was recently denied and can't reapply yet
    IF user_record.seller_status = 'denied' AND 
       user_record.can_reapply_at IS NOT NULL AND 
       user_record.can_reapply_at > now() THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Cannot reapply until ' || user_record.can_reapply_at::text
        );
    END IF;
    
    -- Update user to pending seller status
    UPDATE public.users 
    SET 
        seller_status = 'pending',
        seller_applied_at = now(),
        updated_at = now()
    WHERE id = user_id;
    
    RETURN json_build_object('success', true, 'message', 'Seller application submitted');
END;
$$;

COMMIT;

SELECT 'Function syntax error fixed!' as status;

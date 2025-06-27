-- STEP 3: Create functions and triggers for the redesigned system
-- Run this after step2-create-new-tables.sql

BEGIN;

-- Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS public.manual_signup(text, text, text, text);
DROP FUNCTION IF EXISTS public.check_user_exists(text);
DROP FUNCTION IF EXISTS public.clean_duplicate_user(text);

-- Function to create user entry when auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (
        id, 
        email, 
        role, 
        first_name, 
        last_name, 
        is_anonymous,
        created_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        'user',
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        FALSE,
        NEW.created_at
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        first_name = COALESCE(EXCLUDED.first_name, public.users.first_name),
        last_name = COALESCE(EXCLUDED.last_name, public.users.last_name),
        updated_at = now();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to create escrow hold when event is approved
CREATE OR REPLACE FUNCTION public.create_escrow_hold()
RETURNS TRIGGER AS $$
BEGIN
    -- Create escrow hold for new event (hold until day after event)
    INSERT INTO public.escrow_holds (
        event_id,
        total_amount,
        platform_fee,
        seller_amount,
        hold_until,
        status
    )
    VALUES (
        NEW.id,
        0.00, -- Will be updated as tickets are sold
        0.00,
        0.00,
        (NEW.date + NEW.time + INTERVAL '1 day')::TIMESTAMPTZ,
        'holding'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create escrow hold for new events
DROP TRIGGER IF EXISTS create_escrow_on_event_approval ON public.events;
CREATE TRIGGER create_escrow_on_event_approval
    AFTER INSERT ON public.events
    FOR EACH ROW EXECUTE FUNCTION public.create_escrow_hold();

-- Function to update escrow when tickets are purchased
CREATE OR REPLACE FUNCTION public.update_escrow_on_ticket_purchase()
RETURNS TRIGGER AS $$
DECLARE
    platform_fee_rate DECIMAL(5,4) := 0.029; -- 2.9% platform fee
    calculated_platform_fee DECIMAL(10,2);
    calculated_seller_amount DECIMAL(10,2);
BEGIN
    -- Calculate fees
    calculated_platform_fee := NEW.purchase_amount * platform_fee_rate;
    calculated_seller_amount := NEW.purchase_amount - calculated_platform_fee;
    
    -- Update escrow hold totals
    UPDATE public.escrow_holds 
    SET 
        total_amount = total_amount + NEW.purchase_amount,
        platform_fee = platform_fee + calculated_platform_fee,
        seller_amount = seller_amount + calculated_seller_amount,
        updated_at = now()
    WHERE event_id = NEW.event_id;
    
    -- Create escrow payment record
    INSERT INTO public.escrow_payments (
        escrow_hold_id,
        ticket_id,
        amount,
        platform_fee,
        seller_amount,
        stripe_payment_intent_id
    )
    SELECT 
        eh.id,
        NEW.id,
        NEW.purchase_amount,
        calculated_platform_fee,
        calculated_seller_amount,
        NEW.stripe_payment_intent_id
    FROM public.escrow_holds eh
    WHERE eh.event_id = NEW.event_id;
    
    -- Update event ticket count
    UPDATE public.events 
    SET 
        tickets_sold = tickets_sold + NEW.quantity,
        updated_at = now()
    WHERE id = NEW.event_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update escrow on ticket purchase
DROP TRIGGER IF EXISTS update_escrow_on_ticket_purchase ON public.tickets;
CREATE TRIGGER update_escrow_on_ticket_purchase
    AFTER INSERT ON public.tickets
    FOR EACH ROW EXECUTE FUNCTION public.update_escrow_on_ticket_purchase();

-- Function to apply for seller status
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

-- Function to approve/deny seller application
CREATE OR REPLACE FUNCTION public.review_seller_application(
    user_id UUID,
    approved BOOLEAN,
    admin_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF approved THEN
        UPDATE public.users 
        SET 
            role = 'seller',
            seller_status = 'approved',
            seller_approved_at = now(),
            can_reapply_at = NULL,
            updated_at = now()
        WHERE id = user_id AND seller_status = 'pending';
        
        RETURN json_build_object('success', true, 'message', 'Seller application approved');
    ELSE
        UPDATE public.users 
        SET 
            seller_status = 'denied',
            seller_denied_at = now(),
            can_reapply_at = now() + INTERVAL '7 days', -- 1 week wait
            updated_at = now()
        WHERE id = user_id AND seller_status = 'pending';
        
        RETURN json_build_object('success', true, 'message', 'Seller application denied');
    END IF;
END;
$$;

-- Function to approve event submission and create live event
CREATE OR REPLACE FUNCTION public.approve_event_submission(
    submission_id UUID,
    admin_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    submission RECORD;
    new_event_id UUID;
    event_slug TEXT;
BEGIN
    -- Get submission details
    SELECT * INTO submission FROM public.event_submissions 
    WHERE id = submission_id AND status = 'pending';
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Submission not found or already processed');
    END IF;
    
    -- Generate slug from title
    event_slug := lower(regexp_replace(submission.title, '[^a-zA-Z0-9]+', '-', 'g'));
    event_slug := trim(event_slug, '-') || '-' || extract(epoch from now())::text;
    
    -- Create approved event
    INSERT INTO public.events (
        submission_id,
        seller_id,
        title,
        description,
        date,
        time,
        venue,
        ticket_price,
        image_url,
        slug,
        organizer_email,
        approved_by
    )
    VALUES (
        submission.id,
        submission.seller_id,
        submission.title,
        submission.description,
        submission.date,
        submission.time,
        submission.venue,
        submission.ticket_price,
        submission.image_url,
        event_slug,
        submission.organizer_email,
        admin_id
    )
    RETURNING id INTO new_event_id;
    
    -- Update submission status
    UPDATE public.event_submissions 
    SET 
        status = 'approved',
        reviewed_at = now(),
        reviewed_by = admin_id,
        updated_at = now()
    WHERE id = submission_id;
    
    RETURN json_build_object(
        'success', true, 
        'message', 'Event approved and published',
        'event_id', new_event_id,
        'slug', event_slug
    );
END;
$$;

COMMIT;

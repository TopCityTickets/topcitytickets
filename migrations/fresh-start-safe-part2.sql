-- FRESH START PART 2: Functions, Triggers, and Security
-- Run this AFTER fresh-start-safe-part1.sql completes successfully

BEGIN;

-- ============================================================================
-- 1. CREATE BUSINESS LOGIC FUNCTIONS
-- ============================================================================

-- Function: Apply to become a seller
CREATE OR REPLACE FUNCTION apply_for_seller(
    user_uuid UUID,
    business_name TEXT,
    description TEXT
) RETURNS JSONB AS $$
DECLARE
    user_record RECORD;
    result JSONB;
BEGIN
    -- Get user record
    SELECT * INTO user_record FROM public.users WHERE id = user_uuid;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;
    
    -- Check if user can apply
    IF user_record.seller_status = 'pending' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Application already pending');
    END IF;
    
    IF user_record.seller_status = 'approved' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Already approved as seller');
    END IF;
    
    IF user_record.seller_status = 'denied' AND user_record.can_reapply_at > NOW() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cannot reapply yet. Try again after ' || user_record.can_reapply_at);
    END IF;
    
    -- Update user record
    UPDATE public.users 
    SET 
        seller_status = 'pending',
        seller_business_name = business_name,
        seller_description = description,
        seller_applied_at = NOW(),
        updated_at = NOW()
    WHERE id = user_uuid;
    
    RETURN jsonb_build_object('success', true, 'message', 'Seller application submitted successfully');
END;
$$ LANGUAGE plpgsql;

-- Function: Review seller application (admin only)
CREATE OR REPLACE FUNCTION review_seller_application(
    user_uuid UUID,
    decision TEXT,
    admin_uuid UUID
) RETURNS JSONB AS $$
DECLARE
    user_record RECORD;
    admin_record RECORD;
BEGIN
    -- Verify admin
    SELECT * INTO admin_record FROM public.users WHERE id = admin_uuid AND role = 'admin';
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Admin access required');
    END IF;
    
    -- Get user record
    SELECT * INTO user_record FROM public.users WHERE id = user_uuid;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;
    
    IF user_record.seller_status != 'pending' THEN
        RETURN jsonb_build_object('success', false, 'error', 'No pending application found');
    END IF;
    
    -- Process decision
    IF decision = 'approved' THEN
        UPDATE public.users 
        SET 
            seller_status = 'approved',
            role = 'seller',
            seller_approved_at = NOW(),
            updated_at = NOW()
        WHERE id = user_uuid;
        
        RETURN jsonb_build_object('success', true, 'message', 'Seller application approved');
        
    ELSIF decision = 'denied' THEN
        UPDATE public.users 
        SET 
            seller_status = 'denied',
            can_reapply_at = NOW() + INTERVAL '7 days',
            updated_at = NOW()
        WHERE id = user_uuid;
        
        RETURN jsonb_build_object('success', true, 'message', 'Seller application denied');
    ELSE
        RETURN jsonb_build_object('success', false, 'error', 'Invalid decision. Use approved or denied');
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function: Submit event for approval
CREATE OR REPLACE FUNCTION submit_event_for_approval(
    seller_uuid UUID,
    event_title TEXT,
    event_description TEXT,
    event_date DATE,
    event_time TIME,
    event_venue TEXT,
    ticket_price DECIMAL(10,2),
    event_image_url TEXT,
    organizer_email TEXT
) RETURNS JSONB AS $$
DECLARE
    seller_record RECORD;
    submission_id UUID;
BEGIN
    -- Verify seller
    SELECT * INTO seller_record FROM public.users WHERE id = seller_uuid AND seller_status = 'approved';
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Approved seller status required');
    END IF;
    
    -- Create submission
    INSERT INTO public.event_submissions (
        seller_id, title, description, date, time, venue, 
        ticket_price, image_url, organizer_email
    ) VALUES (
        seller_uuid, event_title, event_description, event_date, event_time, 
        event_venue, ticket_price, event_image_url, organizer_email
    ) RETURNING id INTO submission_id;
    
    RETURN jsonb_build_object('success', true, 'submission_id', submission_id, 'message', 'Event submitted for approval');
END;
$$ LANGUAGE plpgsql;

-- Function: Approve event submission (admin only)
CREATE OR REPLACE FUNCTION approve_event_submission(
    submission_uuid UUID,
    admin_uuid UUID,
    feedback TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    submission_record RECORD;
    admin_record RECORD;
    event_id UUID;
    event_slug TEXT;
BEGIN
    -- Verify admin
    SELECT * INTO admin_record FROM public.users WHERE id = admin_uuid AND role = 'admin';
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Admin access required');
    END IF;
    
    -- Get submission
    SELECT * INTO submission_record FROM public.event_submissions WHERE id = submission_uuid;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Submission not found');
    END IF;
    
    IF submission_record.status != 'pending' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Submission already processed');
    END IF;
    
    -- Generate slug
    event_slug := lower(replace(replace(submission_record.title, ' ', '-'), '''', '')) || '-' || extract(epoch from now())::bigint;
    
    -- Create approved event
    INSERT INTO public.events (
        submission_id, seller_id, title, description, date, time, venue,
        ticket_price, image_url, slug, organizer_email, approved_by
    ) VALUES (
        submission_uuid, submission_record.seller_id, submission_record.title,
        submission_record.description, submission_record.date, submission_record.time,
        submission_record.venue, submission_record.ticket_price, submission_record.image_url,
        event_slug, submission_record.organizer_email, admin_uuid
    ) RETURNING id INTO event_id;
    
    -- Update submission status
    UPDATE public.event_submissions 
    SET 
        status = 'approved',
        admin_feedback = feedback,
        reviewed_at = NOW(),
        reviewed_by = admin_uuid,
        updated_at = NOW()
    WHERE id = submission_uuid;
    
    RETURN jsonb_build_object('success', true, 'event_id', event_id, 'message', 'Event approved and published');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 2. CREATE TRIGGERS
-- ============================================================================

-- Trigger: Auto-create public.users record when auth.users is created
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, role, created_at, updated_at)
    VALUES (NEW.id, NEW.email, 'customer', NEW.created_at, NOW())
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger (this should work in SQL editor)
DO $$
BEGIN
    -- Drop trigger if it exists
    DROP TRIGGER IF EXISTS handle_new_user ON auth.users;
    
    -- Create the trigger
    CREATE TRIGGER handle_new_user
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION handle_new_user();
EXCEPTION 
    WHEN insufficient_privilege THEN 
        RAISE NOTICE 'Cannot create auth trigger - will need to be done manually in Supabase dashboard';
    WHEN OTHERS THEN 
        RAISE NOTICE 'Trigger creation failed: %', SQLERRM;
END $$;

-- Trigger: Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_events_updated_at 
    BEFORE UPDATE ON public.events 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_submissions_updated_at 
    BEFORE UPDATE ON public.event_submissions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- User indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_seller_status ON public.users(seller_status);

-- Event indexes
CREATE INDEX IF NOT EXISTS idx_events_seller_id ON public.events(seller_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date);
CREATE INDEX IF NOT EXISTS idx_events_is_active ON public.events(is_active);
CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events(slug);

-- Event submission indexes
CREATE INDEX IF NOT EXISTS idx_event_submissions_seller_id ON public.event_submissions(seller_id);
CREATE INDEX IF NOT EXISTS idx_event_submissions_status ON public.event_submissions(status);

-- Ticket indexes
CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON public.tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_code ON public.tickets(ticket_code);

-- ============================================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anonymous_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_stripe_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_payment_methods ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. CREATE RLS POLICIES
-- ============================================================================

-- Users policies
CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Anonymous purchases policy (service role only)
CREATE POLICY "Service role access only" ON public.anonymous_purchases 
    FOR ALL USING (auth.role() = 'service_role');

-- Event submissions policies
CREATE POLICY "Sellers can view own submissions" ON public.event_submissions 
    FOR SELECT USING (seller_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Sellers can create submissions" ON public.event_submissions 
    FOR INSERT WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Sellers can update own submissions" ON public.event_submissions 
    FOR UPDATE USING (seller_id = auth.uid());

-- Events policies
CREATE POLICY "Events are publicly viewable" ON public.events 
    FOR SELECT USING (is_active = true);

CREATE POLICY "Sellers can edit own events" ON public.events 
    FOR UPDATE USING (seller_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Tickets policies
CREATE POLICY "Users can view own tickets" ON public.tickets 
    FOR SELECT USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Escrow policies (admin only)
CREATE POLICY "Admin access to escrow" ON public.escrow_holds 
    FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

COMMIT;

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================

SELECT 'FRESH DATABASE SETUP COMPLETE!' as status;

-- Show what was created
SELECT 'Functions created:' as info, count(*) as count 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('apply_for_seller', 'review_seller_application', 'submit_event_for_approval', 'approve_event_submission');

SELECT 'Indexes created:' as info, count(*) as count 
FROM pg_indexes 
WHERE schemaname = 'public' AND indexname LIKE 'idx_%';

SELECT 'RLS policies created:' as info, count(*) as count 
FROM pg_policies WHERE schemaname = 'public';

-- FRESH START: Complete TopCityTickets System Setup
-- Run this on a fresh/reset Supabase database

BEGIN;

-- ============================================================================
-- 1. ENABLE REQUIRED EXTENSIONS
-- ============================================================================

-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 2. CREATE UPDATED USERS TABLE
-- ============================================================================

-- Create public.users table with all required columns
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'customer' CHECK (role IN ('admin', 'seller', 'customer')),
    
    -- Seller workflow columns
    seller_status TEXT DEFAULT 'none' CHECK (seller_status IN ('none', 'pending', 'approved', 'denied')),
    seller_business_name TEXT,
    seller_description TEXT,
    seller_applied_at TIMESTAMPTZ,
    seller_approved_at TIMESTAMPTZ,
    can_reapply_at TIMESTAMPTZ,
    
    -- Payment integration
    stripe_customer_id TEXT UNIQUE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 3. CREATE SYSTEM TABLES
-- ============================================================================

-- Anonymous user purchases (for users who don't want to sign up)
CREATE TABLE public.anonymous_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Event submissions (seller requests that need admin approval)
CREATE TABLE public.event_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES public.users(id),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    venue TEXT NOT NULL,
    ticket_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    image_url TEXT,
    organizer_email TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_feedback TEXT,
    submitted_at TIMESTAMPTZ DEFAULT now(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Approved events (converted from submissions)
CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES public.event_submissions(id),
    seller_id UUID NOT NULL REFERENCES public.users(id),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    venue TEXT NOT NULL,
    ticket_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    image_url TEXT,
    slug TEXT UNIQUE NOT NULL,
    organizer_email TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    tickets_sold INTEGER DEFAULT 0,
    max_tickets INTEGER,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    approved_at TIMESTAMPTZ DEFAULT now(),
    approved_by UUID REFERENCES public.users(id)
);

-- Tickets (for both registered and anonymous users)
CREATE TABLE public.tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id),
    user_id UUID REFERENCES public.users(id),
    anonymous_purchase_id UUID REFERENCES public.anonymous_purchases(id),
    ticket_code TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(12), 'hex'),
    purchase_amount DECIMAL(10,2) NOT NULL,
    quantity INTEGER DEFAULT 1,
    stripe_payment_intent_id TEXT UNIQUE,
    stripe_charge_id TEXT,
    status TEXT DEFAULT 'valid' CHECK (status IN ('valid', 'used', 'cancelled', 'refunded')),
    purchased_at TIMESTAMPTZ DEFAULT now(),
    used_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CHECK ((user_id IS NOT NULL AND anonymous_purchase_id IS NULL) OR 
           (user_id IS NULL AND anonymous_purchase_id IS NOT NULL))
);

-- Escrow holds for event payments
CREATE TABLE public.escrow_holds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id),
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    platform_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    seller_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status TEXT DEFAULT 'holding' CHECK (status IN ('holding', 'released', 'refunded')),
    hold_until TIMESTAMPTZ NOT NULL,
    released_at TIMESTAMPTZ,
    stripe_account_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Track individual payments within escrow
CREATE TABLE public.escrow_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    escrow_hold_id UUID NOT NULL REFERENCES public.escrow_holds(id),
    ticket_id UUID NOT NULL REFERENCES public.tickets(id),
    amount DECIMAL(10,2) NOT NULL,
    platform_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    seller_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    stripe_payment_intent_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Seller Stripe Connect accounts
CREATE TABLE public.seller_stripe_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.users(id),
    stripe_account_id TEXT UNIQUE NOT NULL,
    account_status TEXT DEFAULT 'pending',
    details_submitted BOOLEAN DEFAULT FALSE,
    charges_enabled BOOLEAN DEFAULT FALSE,
    payouts_enabled BOOLEAN DEFAULT FALSE,
    requirements JSONB DEFAULT '{}',
    capabilities JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Customer payment methods (for repeat customers)
CREATE TABLE public.customer_payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id),
    anonymous_purchase_id UUID REFERENCES public.anonymous_purchases(id),
    stripe_customer_id TEXT NOT NULL,
    stripe_payment_method_id TEXT NOT NULL,
    payment_method_type TEXT DEFAULT 'card',
    last_four TEXT,
    brand TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    CHECK ((user_id IS NOT NULL AND anonymous_purchase_id IS NULL) OR 
           (user_id IS NULL AND anonymous_purchase_id IS NOT NULL))
);

-- ============================================================================
-- 4. CREATE BUSINESS LOGIC FUNCTIONS
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

-- Function: Process escrow release (automated)
CREATE OR REPLACE FUNCTION process_escrow_release() RETURNS VOID AS $$
DECLARE
    hold_record RECORD;
BEGIN
    FOR hold_record IN 
        SELECT * FROM public.escrow_holds 
        WHERE status = 'holding' AND hold_until <= NOW()
    LOOP
        UPDATE public.escrow_holds 
        SET 
            status = 'released',
            released_at = NOW(),
            updated_at = NOW()
        WHERE id = hold_record.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. CREATE TRIGGERS
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

CREATE OR REPLACE TRIGGER handle_new_user
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

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
-- 6. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- User indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_seller_status ON public.users(seller_status);
CREATE INDEX IF NOT EXISTS idx_users_can_reapply_at ON public.users(can_reapply_at);

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
CREATE INDEX IF NOT EXISTS idx_tickets_anonymous_purchase_id ON public.tickets(anonymous_purchase_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_code ON public.tickets(ticket_code);

-- Escrow indexes
CREATE INDEX IF NOT EXISTS idx_escrow_holds_event_id ON public.escrow_holds(event_id);
CREATE INDEX IF NOT EXISTS idx_escrow_holds_status ON public.escrow_holds(status);
CREATE INDEX IF NOT EXISTS idx_escrow_holds_hold_until ON public.escrow_holds(hold_until);

-- Anonymous purchase indexes
CREATE INDEX IF NOT EXISTS idx_anonymous_purchases_email ON public.anonymous_purchases(email);
CREATE INDEX IF NOT EXISTS idx_anonymous_purchases_created_at ON public.anonymous_purchases(created_at);

-- ============================================================================
-- 7. ENABLE ROW LEVEL SECURITY
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
-- 8. CREATE RLS POLICIES
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

CREATE POLICY "Admin access to escrow payments" ON public.escrow_payments 
    FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Seller Stripe accounts
CREATE POLICY "Seller stripe account access" ON public.seller_stripe_accounts 
    FOR ALL USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Payment methods
CREATE POLICY "Payment method owner access" ON public.customer_payment_methods 
    FOR ALL USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

COMMIT;

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================

SELECT 'FRESH DATABASE SETUP COMPLETE!' as status;

-- Show what was created
SELECT 'Tables created:' as info, count(*) as count 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'events', 'tickets', 'anonymous_purchases', 'event_submissions', 'escrow_holds', 'escrow_payments', 'seller_stripe_accounts', 'customer_payment_methods');

SELECT 'Indexes created:' as info, count(*) as count 
FROM pg_indexes 
WHERE schemaname = 'public' AND indexname LIKE 'idx_%';

SELECT 'Functions created:' as info, count(*) as count 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('apply_for_seller', 'review_seller_application', 'submit_event_for_approval', 'approve_event_submission', 'process_escrow_release');

SELECT 'RLS policies created:' as info, count(*) as count 
FROM pg_policies WHERE schemaname = 'public';

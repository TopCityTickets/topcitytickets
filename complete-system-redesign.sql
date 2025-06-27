-- COMPLETE SYSTEM REDESIGN FOR TOPCITYTICKETS
-- Based on actual business requirements: anonymous purchases, seller workflow, escrow system

BEGIN;

-- ============================================================================
-- 1. DROP EXISTING TABLES AND FUNCTIONS TO START CLEAN
-- ============================================================================

-- Drop existing functions
DROP FUNCTION IF EXISTS public.manual_signup(text, text, text, text);
DROP FUNCTION IF EXISTS public.check_user_exists(text);
DROP FUNCTION IF EXISTS public.clean_duplicate_user(text);

-- Drop existing tables (be careful - this will remove data!)
-- Uncomment these if you want a completely fresh start:
-- DROP TABLE IF EXISTS public.tickets CASCADE;
-- DROP TABLE IF EXISTS public.event_submissions CASCADE;
-- DROP TABLE IF EXISTS public.events CASCADE;
-- DROP TABLE IF EXISTS public.seller_applications CASCADE;
-- DROP TABLE IF EXISTS public.user_stripe_accounts CASCADE;
-- DROP TABLE IF EXISTS public.user_payment_methods CASCADE;
-- DROP TABLE IF EXISTS public.users CASCADE;

-- ============================================================================
-- 2. CORE USER SYSTEM
-- ============================================================================

-- Users table - handles both registered and anonymous users
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'seller', 'admin')),
    first_name TEXT,
    last_name TEXT,
    is_anonymous BOOLEAN DEFAULT FALSE,
    seller_status TEXT DEFAULT NULL CHECK (seller_status IN (NULL, 'pending', 'approved', 'denied')),
    seller_applied_at TIMESTAMPTZ,
    seller_approved_at TIMESTAMPTZ,
    seller_denied_at TIMESTAMPTZ,
    can_reapply_at TIMESTAMPTZ, -- For denied sellers (1 week wait)
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Foreign key to auth.users (NULL for anonymous users)
    CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Anonymous user purchases (for users who don't want to sign up)
CREATE TABLE IF NOT EXISTS public.anonymous_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 3. EVENT SYSTEM
-- ============================================================================

-- Event submissions (seller requests that need admin approval)
CREATE TABLE IF NOT EXISTS public.event_submissions (
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

-- Approved events (live events that can be purchased)
CREATE TABLE IF NOT EXISTS public.events (
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

-- ============================================================================
-- 4. TICKET AND PURCHASE SYSTEM
-- ============================================================================

-- Tickets (both for registered and anonymous users)
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id),
    
    -- Either user_id OR anonymous_purchase_id will be set
    user_id UUID REFERENCES public.users(id),
    anonymous_purchase_id UUID REFERENCES public.anonymous_purchases(id),
    
    -- Ticket details
    ticket_code TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(12), 'hex'),
    purchase_amount DECIMAL(10,2) NOT NULL,
    quantity INTEGER DEFAULT 1,
    
    -- Payment info
    stripe_payment_intent_id TEXT UNIQUE,
    stripe_charge_id TEXT,
    
    -- Ticket status
    status TEXT DEFAULT 'valid' CHECK (status IN ('valid', 'used', 'cancelled', 'refunded')),
    
    -- Timestamps
    purchased_at TIMESTAMPTZ DEFAULT now(),
    used_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Ensure one of user_id or anonymous_purchase_id is set
    CHECK ((user_id IS NOT NULL AND anonymous_purchase_id IS NULL) OR 
           (user_id IS NULL AND anonymous_purchase_id IS NOT NULL))
);

-- ============================================================================
-- 5. ESCROW SYSTEM
-- ============================================================================

-- Escrow holds for event payments
CREATE TABLE IF NOT EXISTS public.escrow_holds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id),
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    platform_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    seller_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    
    -- Escrow status
    status TEXT DEFAULT 'holding' CHECK (status IN ('holding', 'released', 'refunded')),
    
    -- Release timing (1 day after event)
    hold_until TIMESTAMPTZ NOT NULL,
    released_at TIMESTAMPTZ,
    
    -- Stripe Connect info
    stripe_account_id TEXT, -- Seller's Stripe Connect account
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Track individual payments within escrow
CREATE TABLE IF NOT EXISTS public.escrow_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    escrow_hold_id UUID NOT NULL REFERENCES public.escrow_holds(id),
    ticket_id UUID NOT NULL REFERENCES public.tickets(id),
    amount DECIMAL(10,2) NOT NULL,
    platform_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    seller_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    stripe_payment_intent_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 6. STRIPE INTEGRATION TABLES
-- ============================================================================

-- Seller Stripe Connect accounts
CREATE TABLE IF NOT EXISTS public.seller_stripe_accounts (
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
CREATE TABLE IF NOT EXISTS public.customer_payment_methods (
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
    
    -- Ensure one of user_id or anonymous_purchase_id is set
    CHECK ((user_id IS NOT NULL AND anonymous_purchase_id IS NULL) OR 
           (user_id IS NULL AND anonymous_purchase_id IS NOT NULL))
);

-- ============================================================================
-- 7. INDEXES FOR PERFORMANCE
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

-- ============================================================================
-- 8. TRIGGERS AND FUNCTIONS
-- ============================================================================

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

-- ============================================================================
-- 9. BUSINESS LOGIC FUNCTIONS
-- ============================================================================

-- Function to apply for seller status
CREATE OR REPLACE FUNCTION public.apply_for_seller(user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user RECORD;
BEGIN
    -- Get current user info
    SELECT * INTO current_user FROM public.users WHERE id = user_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'User not found');
    END IF;
    
    -- Check if user is already a seller
    IF current_user.role = 'seller' THEN
        RETURN json_build_object('success', false, 'error', 'User is already a seller');
    END IF;
    
    -- Check if user has pending application
    IF current_user.seller_status = 'pending' THEN
        RETURN json_build_object('success', false, 'error', 'Seller application is already pending');
    END IF;
    
    -- Check if user was recently denied and can't reapply yet
    IF current_user.seller_status = 'denied' AND 
       current_user.can_reapply_at IS NOT NULL AND 
       current_user.can_reapply_at > now() THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Cannot reapply until ' || current_user.can_reapply_at::text
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

-- ============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anonymous_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_payments ENABLE ROW LEVEL SECURITY;

-- Users can see their own data
CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Sellers can see their own submissions and events
CREATE POLICY "Sellers can view own submissions" ON public.event_submissions
    FOR SELECT USING (
        seller_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Sellers can create submissions" ON public.event_submissions
    FOR INSERT WITH CHECK (seller_id = auth.uid());

-- Events are publicly viewable
CREATE POLICY "Events are publicly viewable" ON public.events
    FOR SELECT USING (is_active = true);

-- Sellers can edit their own events, admins can edit all
CREATE POLICY "Sellers can edit own events" ON public.events
    FOR UPDATE USING (
        seller_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- Tickets are viewable by owner or admin
CREATE POLICY "Users can view own tickets" ON public.tickets
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

COMMIT;

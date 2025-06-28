-- COMPLETE FRESH SUPABASE SETUP
-- Run this ONCE in Supabase SQL Editor on your fresh project

-- ============================================================================
-- 1. ENABLE EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 2. CREATE PUBLIC USERS TABLE
-- ============================================================================
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'customer' CHECK (role IN ('admin', 'seller', 'customer')),
    seller_status TEXT DEFAULT 'none' CHECK (seller_status IN ('none', 'pending', 'approved', 'denied')),
    seller_business_name TEXT,
    seller_description TEXT,
    seller_applied_at TIMESTAMPTZ,
    seller_approved_at TIMESTAMPTZ,
    can_reapply_at TIMESTAMPTZ,
    stripe_customer_id TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 3. CREATE ALL OTHER TABLES
-- ============================================================================

-- Anonymous purchases
CREATE TABLE public.anonymous_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Event submissions
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

-- Events
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

-- Tickets
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

-- Escrow holds
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

-- ============================================================================
-- 4. CREATE FUNCTIONS
-- ============================================================================

-- Auto-create user function
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, role, created_at, updated_at)
    VALUES (NEW.id, NEW.email, 'customer', NEW.created_at, NOW())
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Seller application function
CREATE OR REPLACE FUNCTION apply_for_seller(
    user_uuid UUID,
    business_name TEXT,
    description TEXT
) RETURNS JSONB AS $$
DECLARE
    user_record RECORD;
BEGIN
    SELECT * INTO user_record FROM public.users WHERE id = user_uuid;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;
    
    IF user_record.seller_status = 'pending' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Application already pending');
    END IF;
    
    IF user_record.seller_status = 'approved' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Already approved as seller');
    END IF;
    
    UPDATE public.users 
    SET 
        seller_status = 'pending',
        seller_business_name = business_name,
        seller_description = description,
        seller_applied_at = NOW(),
        updated_at = NOW()
    WHERE id = user_uuid;
    
    RETURN jsonb_build_object('success', true, 'message', 'Application submitted');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. CREATE TRIGGERS
-- ============================================================================

-- Auth trigger (will work on fresh Supabase)
CREATE TRIGGER handle_new_user
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update timestamp triggers
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. CREATE INDEXES
-- ============================================================================
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_events_date ON public.events(date);
CREATE INDEX idx_events_slug ON public.events(slug);
CREATE INDEX idx_tickets_event_id ON public.tickets(event_id);

-- ============================================================================
-- 7. ENABLE RLS AND CREATE POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Events are publicly viewable" ON public.events 
    FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view own tickets" ON public.tickets 
    FOR SELECT USING (user_id = auth.uid());

-- ============================================================================
-- DONE!
-- ============================================================================
SELECT 'COMPLETE SUPABASE SETUP FINISHED!' as status;

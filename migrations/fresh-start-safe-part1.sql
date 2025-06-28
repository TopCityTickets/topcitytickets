-- FRESH START: TopCityTickets System (Simplified for Supabase)
-- Run this on a fresh Supabase database - SAFE VERSION

BEGIN;

-- ============================================================================
-- 1. ENABLE REQUIRED EXTENSIONS
-- ============================================================================

-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 2. CREATE PUBLIC USERS TABLE
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
CREATE TABLE IF NOT EXISTS public.anonymous_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

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

-- Approved events (converted from submissions)
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

-- Tickets (for both registered and anonymous users)
CREATE TABLE IF NOT EXISTS public.tickets (
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
CREATE TABLE IF NOT EXISTS public.escrow_holds (
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
    CHECK ((user_id IS NOT NULL AND anonymous_purchase_id IS NULL) OR 
           (user_id IS NULL AND anonymous_purchase_id IS NOT NULL))
);

COMMIT;

-- ============================================================================
-- PART 2: RUN THIS AFTER THE ABOVE COMPLETES
-- ============================================================================

-- To be run separately after tables are created:
SELECT 'PART 1 COMPLETE - Now run the functions and security script' as status;

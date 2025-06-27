-- STEP 2: Create new tables for the redesigned system
-- Run this after step1-add-user-columns.sql

BEGIN;

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

-- Update existing events table or create if not exists
DO $$
BEGIN
    -- Check if events table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events') THEN
        -- Create events table if it doesn't exist
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
    ELSE
        -- Add missing columns to existing events table
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'submission_id') THEN
            ALTER TABLE public.events ADD COLUMN submission_id UUID REFERENCES public.event_submissions(id);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'seller_id') THEN
            ALTER TABLE public.events ADD COLUMN seller_id UUID REFERENCES public.users(id);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'title') THEN
            ALTER TABLE public.events ADD COLUMN title TEXT;
            -- Copy from name if it exists
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'name') THEN
                UPDATE public.events SET title = name WHERE title IS NULL;
            END IF;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'is_active') THEN
            ALTER TABLE public.events ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'tickets_sold') THEN
            ALTER TABLE public.events ADD COLUMN tickets_sold INTEGER DEFAULT 0;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'max_tickets') THEN
            ALTER TABLE public.events ADD COLUMN max_tickets INTEGER;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'approved_at') THEN
            ALTER TABLE public.events ADD COLUMN approved_at TIMESTAMPTZ DEFAULT now();
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'approved_by') THEN
            ALTER TABLE public.events ADD COLUMN approved_by UUID REFERENCES public.users(id);
        END IF;
    END IF;
END $$;

-- Update existing tickets table or create if not exists  
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tickets') THEN
        -- Create tickets table if it doesn't exist
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
    ELSE
        -- Add missing columns to existing tickets table
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tickets' AND column_name = 'anonymous_purchase_id') THEN
            ALTER TABLE public.tickets ADD COLUMN anonymous_purchase_id UUID REFERENCES public.anonymous_purchases(id);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tickets' AND column_name = 'quantity') THEN
            ALTER TABLE public.tickets ADD COLUMN quantity INTEGER DEFAULT 1;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tickets' AND column_name = 'stripe_charge_id') THEN
            ALTER TABLE public.tickets ADD COLUMN stripe_charge_id TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tickets' AND column_name = 'refunded_at') THEN
            ALTER TABLE public.tickets ADD COLUMN refunded_at TIMESTAMPTZ;
        END IF;
    END IF;
END $$;

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

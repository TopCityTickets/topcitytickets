-- STEP 4: Create indexes and security policies
-- Run this after step3-create-functions.sql

BEGIN;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- User indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- Only create seller-related indexes if the columns exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'seller_status') THEN
        CREATE INDEX IF NOT EXISTS idx_users_seller_status ON public.users(seller_status);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'can_reapply_at') THEN
        CREATE INDEX IF NOT EXISTS idx_users_can_reapply_at ON public.users(can_reapply_at);
    END IF;
END $$;

-- Event indexes - check if columns exist first
DO $$
BEGIN
    -- Only create indexes if the events table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events') THEN
        
        -- Check for seller_id column and create index
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'seller_id') THEN
            CREATE INDEX IF NOT EXISTS idx_events_seller_id ON public.events(seller_id);
        END IF;
        
        -- Check for date column (should always exist)
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'date') THEN
            CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date);
        END IF;
        
        -- Check for is_active column
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'is_active') THEN
            CREATE INDEX IF NOT EXISTS idx_events_is_active ON public.events(is_active);
        END IF;
        
        -- Check for slug column
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'slug') THEN
            CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events(slug);
        END IF;
        
    END IF;
END $$;

-- Event submissions indexes - only if table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'event_submissions') THEN
        CREATE INDEX IF NOT EXISTS idx_event_submissions_seller_id ON public.event_submissions(seller_id);
        CREATE INDEX IF NOT EXISTS idx_event_submissions_status ON public.event_submissions(status);
    END IF;
END $$;

-- Ticket indexes - check if table and columns exist
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tickets') THEN
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tickets' AND column_name = 'event_id') THEN
            CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON public.tickets(event_id);
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tickets' AND column_name = 'user_id') THEN
            CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets(user_id);
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tickets' AND column_name = 'anonymous_purchase_id') THEN
            CREATE INDEX IF NOT EXISTS idx_tickets_anonymous_purchase_id ON public.tickets(anonymous_purchase_id);
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tickets' AND column_name = 'status') THEN
            CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tickets' AND column_name = 'ticket_code') THEN
            CREATE INDEX IF NOT EXISTS idx_tickets_ticket_code ON public.tickets(ticket_code);
        END IF;
        
    END IF;
END $$;

-- Escrow indexes - check if tables exist
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'escrow_holds') THEN
        CREATE INDEX IF NOT EXISTS idx_escrow_holds_event_id ON public.escrow_holds(event_id);
        CREATE INDEX IF NOT EXISTS idx_escrow_holds_status ON public.escrow_holds(status);
        CREATE INDEX IF NOT EXISTS idx_escrow_holds_hold_until ON public.escrow_holds(hold_until);
    END IF;
END $$;

-- Anonymous purchase indexes - check if table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'anonymous_purchases') THEN
        CREATE INDEX IF NOT EXISTS idx_anonymous_purchases_email ON public.anonymous_purchases(email);
        CREATE INDEX IF NOT EXISTS idx_anonymous_purchases_created_at ON public.anonymous_purchases(created_at);
    END IF;
END $$;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on tables that exist
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    -- Enable RLS on tables if they exist
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'anonymous_purchases') THEN
        ALTER TABLE public.anonymous_purchases ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'event_submissions') THEN
        ALTER TABLE public.event_submissions ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events') THEN
        ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tickets') THEN
        ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'escrow_holds') THEN
        ALTER TABLE public.escrow_holds ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'escrow_payments') THEN
        ALTER TABLE public.escrow_payments ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'seller_stripe_accounts') THEN
        ALTER TABLE public.seller_stripe_accounts ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customer_payment_methods') THEN
        ALTER TABLE public.customer_payment_methods ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Drop existing policies to avoid conflicts
DO $$
BEGIN
    -- Drop policies only if they exist
    DROP POLICY IF EXISTS "Users can view own data" ON public.users;
    DROP POLICY IF EXISTS "Users can update own data" ON public.users;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'event_submissions') THEN
        DROP POLICY IF EXISTS "Sellers can view own submissions" ON public.event_submissions;
        DROP POLICY IF EXISTS "Sellers can create submissions" ON public.event_submissions;
        DROP POLICY IF EXISTS "Sellers can update own submissions" ON public.event_submissions;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events') THEN
        DROP POLICY IF EXISTS "Events are publicly viewable" ON public.events;
        DROP POLICY IF EXISTS "Sellers can edit own events" ON public.events;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tickets') THEN
        DROP POLICY IF EXISTS "Users can view own tickets" ON public.tickets;
    END IF;
END $$;

-- Create policies only for tables and columns that exist
-- Users can see their own data
CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Policies for new tables (only create if tables exist)
DO $$
BEGIN
    -- Anonymous purchases policy
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'anonymous_purchases') THEN
        EXECUTE 'CREATE POLICY "Service role access only" ON public.anonymous_purchases FOR ALL USING (auth.role() = ''service_role'')';
    END IF;
    
    -- Event submissions policies
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'event_submissions') THEN
        EXECUTE 'CREATE POLICY "Sellers can view own submissions" ON public.event_submissions FOR SELECT USING (seller_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = ''admin''))';
        EXECUTE 'CREATE POLICY "Sellers can create submissions" ON public.event_submissions FOR INSERT WITH CHECK (seller_id = auth.uid())';
        EXECUTE 'CREATE POLICY "Sellers can update own submissions" ON public.event_submissions FOR UPDATE USING (seller_id = auth.uid())';
    END IF;
    
    -- Events policies (check if seller_id column exists)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'is_active') THEN
            EXECUTE 'CREATE POLICY "Events are publicly viewable" ON public.events FOR SELECT USING (is_active = true)';
        ELSE
            -- Fallback if is_active column doesn't exist
            EXECUTE 'CREATE POLICY "Events are publicly viewable" ON public.events FOR SELECT USING (true)';
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'seller_id') THEN
            EXECUTE 'CREATE POLICY "Sellers can edit own events" ON public.events FOR UPDATE USING (seller_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = ''admin''))';
        ELSE
            -- Fallback for existing events table structure
            EXECUTE 'CREATE POLICY "Sellers can edit own events" ON public.events FOR UPDATE USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = ''admin''))';
        END IF;
    END IF;
    
    -- Tickets policies
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tickets') THEN
        EXECUTE 'CREATE POLICY "Users can view own tickets" ON public.tickets FOR SELECT USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = ''admin''))';
    END IF;
    
    -- Escrow policies
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'escrow_holds') THEN
        EXECUTE 'CREATE POLICY "Admin access to escrow" ON public.escrow_holds FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = ''admin''))';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'escrow_payments') THEN
        EXECUTE 'CREATE POLICY "Admin access to escrow payments" ON public.escrow_payments FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = ''admin''))';
    END IF;
    
    -- Seller Stripe accounts
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'seller_stripe_accounts') THEN
        EXECUTE 'CREATE POLICY "Seller stripe account access" ON public.seller_stripe_accounts FOR ALL USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = ''admin''))';
    END IF;
    
    -- Payment methods
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customer_payment_methods') THEN
        EXECUTE 'CREATE POLICY "Payment method owner access" ON public.customer_payment_methods FOR ALL USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = ''admin''))';
    END IF;
END $$;

COMMIT;

-- Display summary of created objects
SELECT 'Migration completed successfully!' as status;

SELECT 
    schemaname,
    tablename,
    indexname
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'events', 'tickets', 'event_submissions', 'escrow_holds', 'anonymous_purchases')
ORDER BY tablename, indexname;

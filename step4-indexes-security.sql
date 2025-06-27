-- STEP 4: Create indexes and security policies
-- Run this after step3-create-functions.sql

BEGIN;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
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
-- ROW LEVEL SECURITY (RLS) POLICIES
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

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Sellers can view own submissions" ON public.event_submissions;
DROP POLICY IF EXISTS "Sellers can create submissions" ON public.event_submissions;
DROP POLICY IF EXISTS "Events are publicly viewable" ON public.events;
DROP POLICY IF EXISTS "Sellers can edit own events" ON public.events;
DROP POLICY IF EXISTS "Users can view own tickets" ON public.tickets;

-- Users can see their own data
CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Anonymous purchases are only accessible by service role
CREATE POLICY "Service role access only" ON public.anonymous_purchases
    FOR ALL USING (auth.role() = 'service_role');

-- Sellers can see their own submissions and events
CREATE POLICY "Sellers can view own submissions" ON public.event_submissions
    FOR SELECT USING (
        seller_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Sellers can create submissions" ON public.event_submissions
    FOR INSERT WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Sellers can update own submissions" ON public.event_submissions
    FOR UPDATE USING (seller_id = auth.uid());

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

-- Escrow policies - admin only
CREATE POLICY "Admin access to escrow" ON public.escrow_holds
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admin access to escrow payments" ON public.escrow_payments
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- Seller Stripe accounts - owner and admin access
CREATE POLICY "Seller stripe account access" ON public.seller_stripe_accounts
    FOR ALL USING (
        user_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- Payment methods - owner access only
CREATE POLICY "Payment method owner access" ON public.customer_payment_methods
    FOR ALL USING (
        user_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

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

-- Stripe Connect Marketplace Setup
-- This adds support for Stripe Connect accounts, escrow payments, and automatic payouts
-- Run this in Supabase SQL Editor AFTER creating the tickets table

-- Add Stripe Connect fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS stripe_customer_id text,
ADD COLUMN IF NOT EXISTS stripe_connect_account_id text,
ADD COLUMN IF NOT EXISTS stripe_connect_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_connect_details_submitted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_connect_charges_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_connect_payouts_enabled boolean DEFAULT false;

-- Add Stripe Connect fields to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS stripe_connect_account_id text;

-- Create stripe_transfers table for tracking payouts
CREATE TABLE IF NOT EXISTS stripe_transfers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  seller_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_transfer_id text UNIQUE NOT NULL,
  gross_amount numeric NOT NULL,
  platform_fee numeric NOT NULL,
  stripe_fee numeric NOT NULL,
  net_amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),
  transfer_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Create indexes for stripe_transfers
CREATE INDEX IF NOT EXISTS idx_stripe_transfers_ticket_id ON stripe_transfers(ticket_id);
CREATE INDEX IF NOT EXISTS idx_stripe_transfers_seller_user_id ON stripe_transfers(seller_user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_transfers_stripe_transfer_id ON stripe_transfers(stripe_transfer_id);
CREATE INDEX IF NOT EXISTS idx_stripe_transfers_status ON stripe_transfers(status);

-- Create trigger for stripe_transfers updated_at
CREATE OR REPLACE FUNCTION update_stripe_transfers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_stripe_transfers_updated_at ON stripe_transfers;
CREATE TRIGGER update_stripe_transfers_updated_at
    BEFORE UPDATE ON stripe_transfers
    FOR EACH ROW
    EXECUTE FUNCTION update_stripe_transfers_updated_at();

-- Enable RLS for stripe_transfers
ALTER TABLE stripe_transfers ENABLE ROW LEVEL SECURITY;

-- RLS policies for stripe_transfers
DROP POLICY IF EXISTS "Users can view own transfers" ON stripe_transfers;
DROP POLICY IF EXISTS "Admins can view all transfers" ON stripe_transfers;
DROP POLICY IF EXISTS "System can insert transfers" ON stripe_transfers;
DROP POLICY IF EXISTS "Admins can update transfers" ON stripe_transfers;

CREATE POLICY "Users can view own transfers" ON stripe_transfers
    FOR SELECT USING (
        auth.uid() = seller_user_id
    );

CREATE POLICY "Admins can view all transfers" ON stripe_transfers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "System can insert transfers" ON stripe_transfers
    FOR INSERT WITH CHECK (true); -- API will handle validation

CREATE POLICY "Admins can update transfers" ON stripe_transfers
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Update tickets table to support escrow and transfer tracking
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS escrow_release_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS transfer_id uuid REFERENCES stripe_transfers(id),
ADD COLUMN IF NOT EXISTS application_fee numeric DEFAULT 0;

-- Create payment_intents table for better Stripe tracking
CREATE TABLE IF NOT EXISTS payment_intents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  stripe_payment_intent_id text UNIQUE NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  application_fee numeric NOT NULL,
  currency text DEFAULT 'usd',
  status text NOT NULL,
  destination_account_id text, -- Stripe Connect account
  client_secret text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Create indexes for payment_intents
CREATE INDEX IF NOT EXISTS idx_payment_intents_stripe_id ON payment_intents(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_user_id ON payment_intents(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_event_id ON payment_intents(event_id);

-- Create trigger for payment_intents updated_at
CREATE OR REPLACE FUNCTION update_payment_intents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_payment_intents_updated_at ON payment_intents;
CREATE TRIGGER update_payment_intents_updated_at
    BEFORE UPDATE ON payment_intents
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_intents_updated_at();

-- Enable RLS for payment_intents
ALTER TABLE payment_intents ENABLE ROW LEVEL SECURITY;

-- RLS policies for payment_intents
DROP POLICY IF EXISTS "Users can view own payment intents" ON payment_intents;
DROP POLICY IF EXISTS "Admins can view all payment intents" ON payment_intents;
DROP POLICY IF EXISTS "System can manage payment intents" ON payment_intents;

CREATE POLICY "Users can view own payment intents" ON payment_intents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payment intents" ON payment_intents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "System can manage payment intents" ON payment_intents
    FOR ALL WITH CHECK (true); -- API will handle validation

-- Verify all tables were created
SELECT 'Stripe Connect marketplace setup completed!' as result;

-- Show updated table structures
SELECT 'users table columns:' as info;
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users' 
AND column_name LIKE '%stripe%'
ORDER BY ordinal_position;

SELECT 'events table columns:' as info;
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'events' 
AND column_name LIKE '%stripe%'
ORDER BY ordinal_position;

SELECT 'New tables created:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('stripe_transfers', 'payment_intents');

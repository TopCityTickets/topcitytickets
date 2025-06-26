-- Add Stripe Connect functionality
-- Run this in Supabase SQL Editor after creating the tickets table

-- Add Stripe account fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id text UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_connect_account_id text UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_onboarding_completed boolean DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_charges_enabled boolean DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_payouts_enabled boolean DEFAULT false;

-- Add Stripe fields to events table  
ALTER TABLE events ADD COLUMN IF NOT EXISTS stripe_product_id text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS stripe_price_id text;

-- Update tickets table with transfer information
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS stripe_transfer_id text;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS transfer_amount numeric;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS platform_fee numeric;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS transferred_at timestamp with time zone;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS transfer_status text DEFAULT 'pending' CHECK (transfer_status IN ('pending', 'completed', 'failed'));

-- Create transfers table for tracking all money movements
CREATE TABLE IF NOT EXISTS transfers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_transfer_id text UNIQUE NOT NULL,
  gross_amount numeric NOT NULL,
  platform_fee numeric NOT NULL,
  stripe_fee numeric NOT NULL,
  net_amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'reversed')),
  scheduled_for timestamp with time zone NOT NULL,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Create indexes for transfers
CREATE INDEX IF NOT EXISTS idx_transfers_ticket_id ON transfers(ticket_id);
CREATE INDEX IF NOT EXISTS idx_transfers_seller_id ON transfers(seller_id);
CREATE INDEX IF NOT EXISTS idx_transfers_stripe_transfer_id ON transfers(stripe_transfer_id);
CREATE INDEX IF NOT EXISTS idx_transfers_status ON transfers(status);
CREATE INDEX IF NOT EXISTS idx_transfers_scheduled_for ON transfers(scheduled_for);

-- Create trigger to update transfers updated_at
CREATE OR REPLACE FUNCTION update_transfers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_transfers_updated_at ON transfers;
CREATE TRIGGER update_transfers_updated_at
    BEFORE UPDATE ON transfers
    FOR EACH ROW
    EXECUTE FUNCTION update_transfers_updated_at();

-- Add RLS policies for transfers
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;

-- Sellers can view their own transfers
CREATE POLICY "Sellers can view own transfers" ON transfers
    FOR SELECT USING (auth.uid() = seller_id);

-- Only admins and the system can insert/update transfers
CREATE POLICY "Admins can manage transfers" ON transfers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Create payment_methods table for saved user payment methods
CREATE TABLE IF NOT EXISTS payment_methods (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_payment_method_id text UNIQUE NOT NULL,
  type text NOT NULL, -- 'card', 'bank_account', etc.
  brand text, -- 'visa', 'mastercard', etc.
  last4 text,
  exp_month integer,
  exp_year integer,
  is_default boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Create indexes for payment_methods
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_stripe_id ON payment_methods(stripe_payment_method_id);

-- Add RLS policies for payment_methods
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Users can only see their own payment methods
CREATE POLICY "Users can view own payment methods" ON payment_methods
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own payment methods
CREATE POLICY "Users can insert own payment methods" ON payment_methods
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own payment methods
CREATE POLICY "Users can update own payment methods" ON payment_methods
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own payment methods
CREATE POLICY "Users can delete own payment methods" ON payment_methods
    FOR DELETE USING (auth.uid() = user_id);

-- Create trigger to update payment_methods updated_at
CREATE OR REPLACE FUNCTION update_payment_methods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_payment_methods_updated_at ON payment_methods;
CREATE TRIGGER update_payment_methods_updated_at
    BEFORE UPDATE ON payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_methods_updated_at();

-- Verify schema updates
SELECT 'Stripe Connect schema updated successfully!' as result;

-- Show updated users table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users'
AND column_name LIKE '%stripe%'
ORDER BY ordinal_position;

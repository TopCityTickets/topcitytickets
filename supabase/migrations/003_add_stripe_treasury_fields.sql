-- Add Stripe Treasury fields to users table
-- Migration: 003_add_stripe_treasury_fields.sql

-- Add the new columns for Stripe Treasury integration
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS stripe_financial_account_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_treasury_enabled BOOLEAN DEFAULT FALSE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_stripe_financial_account_id 
ON public.users(stripe_financial_account_id);

CREATE INDEX IF NOT EXISTS idx_users_stripe_treasury_enabled 
ON public.users(stripe_treasury_enabled);

-- Update the escrow_holds table to include financial account reference
ALTER TABLE public.escrow_holds 
ADD COLUMN IF NOT EXISTS financial_account_id TEXT;

-- Add index for financial account lookups in escrow
CREATE INDEX IF NOT EXISTS idx_escrow_holds_financial_account_id 
ON public.escrow_holds(financial_account_id);

-- Comment to explain the fields
COMMENT ON COLUMN public.users.stripe_financial_account_id IS 'Stripe Treasury Financial Account ID for this seller';
COMMENT ON COLUMN public.users.stripe_treasury_enabled IS 'Whether this seller has Treasury functionality enabled';
COMMENT ON COLUMN public.escrow_holds.financial_account_id IS 'Associated Stripe Financial Account for this escrow hold';

-- Create tickets table for purchased event tickets
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_payment_intent_id text UNIQUE,
  ticket_code text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  purchase_amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'valid' CHECK (status IN ('valid', 'used', 'cancelled', 'refunded')),
  purchased_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  used_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_stripe_payment_intent ON tickets(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_code ON tickets(ticket_code);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_tickets_updated_at ON tickets;
CREATE TRIGGER update_tickets_updated_at
    BEFORE UPDATE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_tickets_updated_at();

-- Add RLS policies for tickets
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Users can only see their own tickets
CREATE POLICY "Users can view own tickets" ON tickets
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own tickets (via API)
CREATE POLICY "Users can insert own tickets" ON tickets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Only admins can update tickets
CREATE POLICY "Admins can update tickets" ON tickets
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Verify table creation
SELECT 'Tickets table created successfully!' as result;

-- Show table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'tickets'
ORDER BY ordinal_position;

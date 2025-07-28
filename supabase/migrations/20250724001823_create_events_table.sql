-- Create events table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  time TIME NOT NULL,
  location TEXT,
  price DECIMAL(10,2) DEFAULT 0.00,
  capacity INTEGER DEFAULT 100,
  tickets_sold INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed')),
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT,
  category TEXT,
  venue TEXT,
  max_tickets INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for events
-- Anyone can view active events
CREATE POLICY "Anyone can view active events" ON public.events
  FOR SELECT USING (status = 'active');

-- Sellers can view their own events
CREATE POLICY "Sellers can view own events" ON public.events
  FOR SELECT USING (auth.uid() = seller_id);

-- Sellers can insert events
CREATE POLICY "Sellers can create events" ON public.events
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

-- Sellers can update their own events
CREATE POLICY "Sellers can update own events" ON public.events
  FOR UPDATE USING (auth.uid() = seller_id);

-- Admins can view all events
CREATE POLICY "Admins can view all events" ON public.events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update any event
CREATE POLICY "Admins can update any event" ON public.events
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Grant permissions
GRANT ALL ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date);
CREATE INDEX IF NOT EXISTS idx_events_seller_id ON public.events(seller_id);

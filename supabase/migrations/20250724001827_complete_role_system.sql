-- Create seller applications table for role-based approval system
CREATE TABLE IF NOT EXISTS public.seller_applications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  business_name text NOT NULL,
  business_type text NOT NULL,
  description text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone DEFAULT NOW(),
  updated_at timestamp with time zone DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.seller_applications ENABLE ROW LEVEL SECURITY;

-- RLS policies for seller applications
CREATE POLICY "Users can view own applications" ON public.seller_applications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own applications" ON public.seller_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all applications" ON public.seller_applications
  FOR SELECT USING (
    public.user_has_permission(auth.uid(), 'manage_users')
  );

CREATE POLICY "Admins can update applications" ON public.seller_applications
  FOR UPDATE USING (
    public.user_has_permission(auth.uid(), 'manage_users')
  );

-- Create tickets table for the ticketing system
CREATE TABLE IF NOT EXISTS public.tickets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  buyer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  total_price decimal(10,2) NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'used', 'refunded', 'cancelled')),
  purchased_at timestamp with time zone DEFAULT NOW(),
  used_at timestamp with time zone,
  ticket_codes text[] -- Array of unique ticket codes
);

-- Enable RLS on tickets
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- RLS policies for tickets
CREATE POLICY "Users can view own tickets" ON public.tickets
  FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "Users can purchase tickets" ON public.tickets
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Event sellers can view tickets for their events" ON public.tickets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.events e 
      WHERE e.id = event_id AND e.seller_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all tickets" ON public.tickets
  FOR SELECT USING (
    public.user_has_permission(auth.uid(), 'manage_all_events')
  );

-- Create function to update ticket sales count
CREATE OR REPLACE FUNCTION public.update_event_ticket_sales()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increase tickets_sold when new ticket is purchased
    UPDATE public.events 
    SET tickets_sold = tickets_sold + NEW.quantity
    WHERE id = NEW.event_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle status changes (refunds, cancellations)
    IF OLD.status = 'active' AND NEW.status IN ('refunded', 'cancelled') THEN
      UPDATE public.events 
      SET tickets_sold = tickets_sold - OLD.quantity
      WHERE id = OLD.event_id;
    ELSIF OLD.status IN ('refunded', 'cancelled') AND NEW.status = 'active' THEN
      UPDATE public.events 
      SET tickets_sold = tickets_sold + OLD.quantity
      WHERE id = OLD.event_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrease tickets_sold when ticket is deleted
    UPDATE public.events 
    SET tickets_sold = tickets_sold - OLD.quantity
    WHERE id = OLD.event_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for automatic ticket sales counting
DROP TRIGGER IF EXISTS update_ticket_sales_trigger ON public.tickets;
CREATE TRIGGER update_ticket_sales_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_event_ticket_sales();

-- Grant permissions
GRANT ALL ON public.seller_applications TO authenticated, service_role;
GRANT ALL ON public.tickets TO authenticated, service_role;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_seller_applications_user_id ON public.seller_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_seller_applications_status ON public.seller_applications(status);
CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON public.tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_buyer_id ON public.tickets(buyer_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);

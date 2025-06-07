-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_is_approved ON public.events(is_approved);
CREATE INDEX IF NOT EXISTS idx_event_submissions_status ON public.event_submissions(status);
CREATE INDEX IF NOT EXISTS idx_seller_applications_status ON public.seller_applications(status);

-- Add admin bypass policies
CREATE POLICY "Admin bypass for events" ON public.events
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Admin bypass for event_submissions" ON public.event_submissions
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Admin bypass for seller_applications" ON public.seller_applications
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Add function to handle seller approval
CREATE OR REPLACE FUNCTION public.handle_seller_approval()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' THEN
        UPDATE public.users
        SET role = 'seller'
        WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger for seller approval
CREATE TRIGGER on_seller_approved
    AFTER UPDATE ON public.seller_applications
    FOR EACH ROW
    WHEN (NEW.status = 'approved')
    EXECUTE FUNCTION public.handle_seller_approval();

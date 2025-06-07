-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can submit applications" ON public.seller_applications;
DROP POLICY IF EXISTS "Users can view own applications" ON public.seller_applications;
DROP POLICY IF EXISTS "Anyone can view approved events" ON public.events;
DROP POLICY IF EXISTS "Sellers can view own events" ON public.events;
DROP POLICY IF EXISTS "Sellers can submit events" ON public.event_submissions;
DROP POLICY IF EXISTS "Users can view own submissions" ON public.event_submissions;

-- Recreate policies
CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can submit applications" ON public.seller_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own applications" ON public.seller_applications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view approved events" ON public.events
  FOR SELECT USING (is_approved = true);

CREATE POLICY "Sellers can view own events" ON public.events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Sellers can submit events" ON public.event_submissions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'seller'
    )
  );

CREATE POLICY "Users can view own submissions" ON public.event_submissions
  FOR SELECT USING (auth.uid() = user_id);

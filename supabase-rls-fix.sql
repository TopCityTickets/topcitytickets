-- Supabase RLS Policy Fix for RBAC
-- Run this in Supabase SQL Editor to ensure proper RLS policies

-- 1. Check current policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('user_roles', 'seller_applications', 'events', 'users')
ORDER BY tablename, policyname;

-- 2. Fix user_roles policies to use Supabase auth properly
DROP POLICY IF EXISTS "Users can read their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;

CREATE POLICY "Users can read their own roles" ON public.user_roles
FOR SELECT USING (
  auth.uid() = user_id
);

CREATE POLICY "Admins can manage user roles" ON public.user_roles
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'
  )
  OR
  EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.id = auth.uid() 
    AND u.role = 'admin'
  )
);

-- 3. Fix seller_applications policies
DROP POLICY IF EXISTS "Users can view their own applications" ON public.seller_applications;
DROP POLICY IF EXISTS "Users can create applications" ON public.seller_applications;
DROP POLICY IF EXISTS "Admins can manage all applications" ON public.seller_applications;

CREATE POLICY "Users can view their own applications" ON public.seller_applications
FOR SELECT USING (
  auth.uid() = user_id
);

CREATE POLICY "Users can create applications" ON public.seller_applications
FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

CREATE POLICY "Admins can manage all applications" ON public.seller_applications
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'
  )
  OR
  EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.id = auth.uid() 
    AND u.role = 'admin'
  )
);

-- 4. Fix events policies
DROP POLICY IF EXISTS "Public can view approved events" ON public.events;
DROP POLICY IF EXISTS "Sellers can manage their events" ON public.events;
DROP POLICY IF EXISTS "Admins can manage all events" ON public.events;

CREATE POLICY "Public can view approved events" ON public.events
FOR SELECT USING (is_approved = true);

CREATE POLICY "Sellers can manage their events" ON public.events
FOR ALL USING (
  auth.uid() = user_id OR auth.uid() = created_by
);

CREATE POLICY "Admins can manage all events" ON public.events
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'
  )
  OR
  EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.id = auth.uid() 
    AND u.role = 'admin'
  )
);

-- 5. Ensure RLS is enabled on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

SELECT 'Supabase RLS policies updated successfully!' as result;

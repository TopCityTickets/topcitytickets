-- TopCityTickets Complete Database Setup (Fixed for Infinite Recursion)
-- Run this entire script in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'seller', 'admin')),
  setup_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- EVENTS TABLE  
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  time TIME NOT NULL,
  price DECIMAL(10,2) DEFAULT 0.00,
  capacity INTEGER DEFAULT 100,
  tickets_sold INTEGER DEFAULT 0,
  image_url TEXT,
  max_tickets INTEGER DEFAULT 100,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed')),
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  location TEXT,
  category TEXT,
  venue TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SELLER APPLICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.seller_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  business_type TEXT,
  contact_info JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  notes TEXT
);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    NEW.raw_user_meta_data->>'full_name',
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES - FIXED FOR NO RECURSION
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_applications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view active events" ON public.events;
DROP POLICY IF EXISTS "Users can view all events if authenticated" ON public.events;
DROP POLICY IF EXISTS "Users with create_events permission can create events" ON public.events;
DROP POLICY IF EXISTS "Users can update own events with manage_own_events permission" ON public.events;
DROP POLICY IF EXISTS "Admins can update any event" ON public.events;
DROP POLICY IF EXISTS "Users can view own applications" ON public.seller_applications;
DROP POLICY IF EXISTS "Users can create own applications" ON public.seller_applications;
DROP POLICY IF EXISTS "Admins can view all applications" ON public.seller_applications;
DROP POLICY IF EXISTS "Admins can update applications" ON public.seller_applications;

-- PROFILES TABLE POLICIES (NO RECURSION)
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users only" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- EVENTS TABLE POLICIES
CREATE POLICY "Anyone can view active events" ON public.events
  FOR SELECT USING (status = 'active');

CREATE POLICY "Users can view all events if authenticated" ON public.events
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Sellers can create events" ON public.events
  FOR INSERT WITH CHECK (
    auth.uid() = seller_id AND 
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can update own events" ON public.events
  FOR UPDATE USING (auth.uid() = seller_id);

-- SELLER APPLICATIONS POLICIES
CREATE POLICY "Users can view own applications" ON public.seller_applications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own applications" ON public.seller_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- PERMISSIONS
-- ============================================================================

-- Grant permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
GRANT ALL ON public.seller_applications TO authenticated;
GRANT ALL ON public.seller_applications TO service_role;

-- Success message
SELECT 'TopCityTickets database setup completed successfully! (No recursion policies)' as status;

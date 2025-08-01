-- Complete Database Setup for Top City Tickets
-- Run this in your Supabase SQL Editor

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email text,
    full_name text,
    avatar_url text,
    role text DEFAULT 'user' CHECK (role IN ('user', 'seller', 'admin')),
    setup_completed boolean DEFAULT false,
    bio text,
    phone text,
    address text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Ensure all required columns exist in profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS setup_completed boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Create events table (without foreign key initially)
CREATE TABLE IF NOT EXISTS public.events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text,
    event_date timestamp with time zone NOT NULL,
    location text NOT NULL,
    ticket_price decimal(10,2) NOT NULL,
    total_tickets integer NOT NULL,
    available_tickets integer NOT NULL,
    organizer_id uuid,
    image_url text,
    category text,
    status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled', 'sold_out')),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Ensure all required columns exist in events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS event_date timestamp with time zone;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS date date;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS time time;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS venue text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS ticket_price decimal(10,2);
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS price decimal(10,2);
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS total_tickets integer;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS available_tickets integer;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS organizer_id uuid;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Handle the date column naming issue
-- If there's a 'date' column, we need to work with it
DO $$
BEGIN
    -- Check if 'date' column exists and has NOT NULL constraint
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='date' AND table_schema='public') THEN
        -- If event_date column also exists, copy data from event_date to date
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='event_date' AND table_schema='public') THEN
            UPDATE public.events SET date = event_date WHERE date IS NULL AND event_date IS NOT NULL;
            -- Drop the event_date column since we'll use date
            ALTER TABLE public.events DROP COLUMN IF EXISTS event_date;
        END IF;
    ELSE
        -- If only event_date exists, that's fine
        NULL;
    END IF;
END $$;

-- Add foreign key constraint after profiles table exists
-- First ensure the column exists
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS organizer_id uuid;

-- Then add the foreign key constraint (drop first if exists)
ALTER TABLE public.events 
DROP CONSTRAINT IF EXISTS events_organizer_id_fkey;

ALTER TABLE public.events 
ADD CONSTRAINT events_organizer_id_fkey 
FOREIGN KEY (organizer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Create tickets table (without foreign keys initially)
CREATE TABLE IF NOT EXISTS public.tickets (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id uuid,
    buyer_id uuid,
    ticket_code text UNIQUE NOT NULL,
    purchase_date timestamp with time zone DEFAULT now(),
    price decimal(10,2) NOT NULL,
    status text DEFAULT 'active' CHECK (status IN ('active', 'used', 'refunded', 'cancelled')),
    created_at timestamp with time zone DEFAULT now()
);

-- Ensure all required columns exist in tickets table
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS event_id uuid;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS buyer_id uuid;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS ticket_code text;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS purchase_date timestamp with time zone DEFAULT now();
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS price decimal(10,2);
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();

-- Add foreign key constraints after other tables exist
-- First ensure the columns exist
ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS event_id uuid;

ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS buyer_id uuid;

-- Then add the foreign key constraints (drop first if exists)
ALTER TABLE public.tickets 
DROP CONSTRAINT IF EXISTS tickets_event_id_fkey;

ALTER TABLE public.tickets 
DROP CONSTRAINT IF EXISTS tickets_buyer_id_fkey;

ALTER TABLE public.tickets 
ADD CONSTRAINT tickets_event_id_fkey 
FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

ALTER TABLE public.tickets 
ADD CONSTRAINT tickets_buyer_id_fkey 
FOREIGN KEY (buyer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies first
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Events are viewable by everyone" ON public.events;
DROP POLICY IF EXISTS "Sellers can insert events" ON public.events;
DROP POLICY IF EXISTS "Sellers can update own events" ON public.events;
DROP POLICY IF EXISTS "Users can view own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can insert own tickets" ON public.tickets;

-- Simple RLS Policies (avoiding recursion)

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Events policies (public read access)
CREATE POLICY "Events are viewable by everyone" ON public.events
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert events" ON public.events
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own events" ON public.events
    FOR UPDATE USING (auth.uid() = organizer_id);

-- Tickets policies
CREATE POLICY "Users can view own tickets" ON public.tickets
    FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "Users can insert tickets" ON public.tickets
    FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to automatically create profile for new users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Database setup complete!
-- Sample events can be added later through the application interface

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO anon, authenticated;
GRANT ALL ON public.events TO anon, authenticated;
GRANT ALL ON public.tickets TO anon, authenticated;

-- Enable realtime for tables (optional)
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;

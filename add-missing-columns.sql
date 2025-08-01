-- Fix missing setup_completed column and ensure all required columns exist
-- Run this in your Supabase SQL Editor

-- First, make sure the profiles table exists with basic structure
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add all missing columns one by one (IF NOT EXISTS equivalent)
DO $$
BEGIN
    -- Add email column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='profiles' AND column_name='email' AND table_schema='public') THEN
        ALTER TABLE public.profiles ADD COLUMN email TEXT;
    END IF;
    
    -- Add full_name column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='profiles' AND column_name='full_name' AND table_schema='public') THEN
        ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
    END IF;
    
    -- Add role column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='profiles' AND column_name='role' AND table_schema='public') THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('user', 'seller', 'admin'));
    END IF;
    
    -- Add setup_completed column (THE MISSING ONE)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='profiles' AND column_name='setup_completed' AND table_schema='public') THEN
        ALTER TABLE public.profiles ADD COLUMN setup_completed BOOLEAN DEFAULT false;
    END IF;
    
    -- Add updated_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='profiles' AND column_name='updated_at' AND table_schema='public') THEN
        ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END
$$;

-- Update any existing profiles to have setup_completed = false if it's NULL
UPDATE public.profiles 
SET setup_completed = false 
WHERE setup_completed IS NULL;

-- Ensure the trigger function exists for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, setup_completed)
  VALUES (
    NEW.id, 
    NEW.email, 
    NEW.raw_user_meta_data->>'full_name',
    'user',
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

SELECT 'setup_completed column added and all profile columns fixed!' as status;

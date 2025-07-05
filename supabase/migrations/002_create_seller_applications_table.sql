-- Create seller_applications table
CREATE TABLE IF NOT EXISTS public.seller_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    business_name TEXT NOT NULL,
    business_type TEXT NOT NULL,
    business_description TEXT,
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    website_url TEXT,
    is_active BOOLEAN DEFAULT false NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_seller_applications_seller_id ON public.seller_applications(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_applications_is_active ON public.seller_applications(is_active);
CREATE INDEX IF NOT EXISTS idx_seller_applications_created_at ON public.seller_applications(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.seller_applications ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
CREATE POLICY "Users can view their own seller applications" ON public.seller_applications
    FOR SELECT USING (auth.uid() = seller_id);

CREATE POLICY "Users can insert their own seller applications" ON public.seller_applications
    FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Users can update their own seller applications" ON public.seller_applications
    FOR UPDATE USING (auth.uid() = seller_id);

-- Admin policy for viewing all applications
CREATE POLICY "Admins can view all seller applications" ON public.seller_applications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_seller_applications_updated_at
    BEFORE UPDATE ON public.seller_applications
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

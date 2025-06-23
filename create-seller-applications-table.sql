-- Create seller_applications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.seller_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_seller_applications_user_id ON seller_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_seller_applications_status ON seller_applications(status);

-- Disable RLS temporarily to allow applications to work
ALTER TABLE public.seller_applications DISABLE ROW LEVEL SECURITY;

-- Check current applications
SELECT 
    sa.id,
    sa.user_id,
    sa.status,
    sa.applied_at,
    u.email,
    u.role as current_role
FROM public.seller_applications sa
LEFT JOIN public.users u ON sa.user_id = u.id
ORDER BY sa.applied_at DESC
LIMIT 10;

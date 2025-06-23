-- Create seller applications table
CREATE TABLE seller_applications (
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

-- Create index for faster queries
CREATE INDEX idx_seller_applications_user_id ON seller_applications(user_id);
CREATE INDEX idx_seller_applications_status ON seller_applications(status);

-- Enable RLS
ALTER TABLE seller_applications ENABLE ROW LEVEL SECURITY;

-- Policies for seller_applications
-- Users can view their own applications
CREATE POLICY "Users can view own applications"
ON seller_applications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own applications (but only one pending at a time)
CREATE POLICY "Users can create applications"
ON seller_applications
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND 
  NOT EXISTS (
    SELECT 1 FROM seller_applications 
    WHERE user_id = auth.uid() AND status = 'pending'
  )
);

-- Admins can view all applications
CREATE POLICY "Admins can view all applications"
ON seller_applications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Admins can update application status
CREATE POLICY "Admins can update applications"
ON seller_applications
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Function to automatically update user role when application is approved
CREATE OR REPLACE FUNCTION handle_seller_application_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- If application was approved, update user role to 'seller'
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    UPDATE users 
    SET role = 'seller', updated_at = NOW()
    WHERE id = NEW.user_id;
    
    -- Set reviewed timestamp
    NEW.reviewed_at = NOW();
    NEW.reviewed_by = auth.uid();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_seller_application_approved
  BEFORE UPDATE ON seller_applications
  FOR EACH ROW
  EXECUTE FUNCTION handle_seller_application_approval();

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_seller_applications_updated_at
  BEFORE UPDATE ON seller_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

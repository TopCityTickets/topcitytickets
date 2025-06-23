-- This script ensures the seller_applications table is properly set up with correct policies and triggers
-- It will create the table if it doesn't exist, or leave it alone if it does

-- First check if the table exists and create it if not
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'seller_applications'
  ) THEN
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

    -- Create indexes for faster queries
    CREATE INDEX idx_seller_applications_user_id ON seller_applications(user_id);
    CREATE INDEX idx_seller_applications_status ON seller_applications(status);
    
    -- Enable RLS
    ALTER TABLE seller_applications ENABLE ROW LEVEL SECURITY;
    
    RAISE NOTICE 'Created seller_applications table';
  ELSE
    RAISE NOTICE 'seller_applications table already exists, skipping creation';
  END IF;
END $$;

-- Make sure the policies exist or create them

-- Check and create "Users can view own applications" policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'seller_applications'
    AND policyname = 'Users can view own applications'
  ) THEN
    -- Users can view their own applications
    CREATE POLICY "Users can view own applications"
    ON seller_applications
    FOR SELECT
    USING (auth.uid() = user_id);
    
    RAISE NOTICE 'Created "Users can view own applications" policy';
  ELSE
    RAISE NOTICE '"Users can view own applications" policy already exists';
  END IF;
END $$;

-- Check and create "Users can create applications" policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'seller_applications'
    AND policyname = 'Users can create applications'
  ) THEN
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
    
    RAISE NOTICE 'Created "Users can create applications" policy';
  ELSE
    RAISE NOTICE '"Users can create applications" policy already exists';
  END IF;
END $$;

-- Check and create "Admins can view all applications" policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'seller_applications'
    AND policyname = 'Admins can view all applications'
  ) THEN
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
    
    RAISE NOTICE 'Created "Admins can view all applications" policy';
  ELSE
    RAISE NOTICE '"Admins can view all applications" policy already exists';
  END IF;
END $$;

-- Check and create "Admins can update applications" policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'seller_applications'
    AND policyname = 'Admins can update applications'
  ) THEN
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
    
    RAISE NOTICE 'Created "Admins can update applications" policy';
  ELSE
    RAISE NOTICE '"Admins can update applications" policy already exists';
  END IF;
END $$;

-- Check if the trigger function exists and create it if not
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc
    WHERE proname = 'handle_seller_application_approval'
  ) THEN
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
    
    RAISE NOTICE 'Created handle_seller_application_approval function';
  ELSE
    RAISE NOTICE 'handle_seller_application_approval function already exists';
  END IF;
END $$;

-- Check if the trigger exists and create it if not
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'on_seller_application_approved'
  ) THEN
    -- Create trigger
    CREATE TRIGGER on_seller_application_approved
      BEFORE UPDATE ON seller_applications
      FOR EACH ROW
      EXECUTE FUNCTION handle_seller_application_approval();
    
    RAISE NOTICE 'Created on_seller_application_approved trigger';
  ELSE
    RAISE NOTICE 'on_seller_application_approved trigger already exists';
  END IF;
END $$;

-- Check if updated_at function exists and create it if not
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc
    WHERE proname = 'update_updated_at_column'
  ) THEN
    -- Create updated_at trigger function
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    RAISE NOTICE 'Created update_updated_at_column function';
  ELSE
    RAISE NOTICE 'update_updated_at_column function already exists';
  END IF;
END $$;

-- Check if the update_updated_at trigger exists and create it if not
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgrelid = 'seller_applications'::regclass
    AND tgname = 'set_updated_at'
  ) THEN
    -- Create updated_at trigger
    CREATE TRIGGER set_updated_at
      BEFORE UPDATE ON seller_applications
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    
    RAISE NOTICE 'Created set_updated_at trigger on seller_applications';
  ELSE
    RAISE NOTICE 'set_updated_at trigger already exists on seller_applications';
  END IF;
END $$;

-- Verify the table structure is correct
DO $$
DECLARE
  missing_column boolean := false;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_applications' AND column_name = 'user_id') THEN
    RAISE NOTICE 'Missing column: user_id';
    missing_column := true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_applications' AND column_name = 'status') THEN
    RAISE NOTICE 'Missing column: status';
    missing_column := true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_applications' AND column_name = 'applied_at') THEN
    RAISE NOTICE 'Missing column: applied_at';
    missing_column := true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_applications' AND column_name = 'reviewed_at') THEN
    RAISE NOTICE 'Missing column: reviewed_at';
    missing_column := true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_applications' AND column_name = 'reviewed_by') THEN
    RAISE NOTICE 'Missing column: reviewed_by';
    missing_column := true;
  END IF;
  
  IF missing_column THEN
    RAISE NOTICE 'seller_applications table structure is incomplete. Consider dropping and recreating the table.';
  ELSE
    RAISE NOTICE 'seller_applications table structure is complete.';
  END IF;
END $$;

-- Final check to verify RLS is enabled
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'seller_applications' AND rowsecurity = false
  ) THEN
    ALTER TABLE seller_applications ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Enabled RLS on seller_applications table';
  ELSE
    RAISE NOTICE 'RLS is already enabled on seller_applications table';
  END IF;
END $$;

-- This script updates the seller_applications table to match the expected structure
-- It adds missing columns that our application code expects

-- First check if the table exists
DO $outer_block$
BEGIN
  IF EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'seller_applications'
  ) THEN
    -- Table exists, check and add missing columns

    -- Check and add applied_at column
    IF NOT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = 'seller_applications'
      AND column_name = 'applied_at'
    ) THEN
      ALTER TABLE seller_applications 
      ADD COLUMN applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
      RAISE NOTICE 'Added applied_at column to seller_applications';
    END IF;

    -- Check and add reviewed_at column
    IF NOT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = 'seller_applications'
      AND column_name = 'reviewed_at'
    ) THEN
      ALTER TABLE seller_applications 
      ADD COLUMN reviewed_at TIMESTAMP WITH TIME ZONE;
      RAISE NOTICE 'Added reviewed_at column to seller_applications';
    END IF;

    -- Check and add reviewed_by column
    IF NOT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = 'seller_applications'
      AND column_name = 'reviewed_by'
    ) THEN
      ALTER TABLE seller_applications 
      ADD COLUMN reviewed_by UUID REFERENCES auth.users(id);
      RAISE NOTICE 'Added reviewed_by column to seller_applications';
    END IF;

    -- Check and add notes column
    IF NOT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = 'seller_applications'
      AND column_name = 'notes'
    ) THEN
      ALTER TABLE seller_applications 
      ADD COLUMN notes TEXT;
      RAISE NOTICE 'Added notes column to seller_applications';
    END IF;

    -- Check and add updated_at column
    IF NOT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = 'seller_applications'
      AND column_name = 'updated_at'
    ) THEN
      ALTER TABLE seller_applications 
      ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
      RAISE NOTICE 'Added updated_at column to seller_applications';
    END IF;

    -- Update existing records to have applied_at = created_at
    UPDATE seller_applications 
    SET applied_at = created_at 
    WHERE applied_at IS NULL;
    RAISE NOTICE 'Updated existing records with applied_at = created_at';

    -- Make sure RLS is enabled
    ALTER TABLE seller_applications ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Enabled RLS on seller_applications';

    RAISE NOTICE 'seller_applications table structure has been updated successfully';

  ELSE
    -- Table doesn't exist, let's create it
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
    
    RAISE NOTICE 'Created seller_applications table with all required columns';
  END IF;
END $outer_block$;

-- Create trigger function for updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

-- Now create triggers if they don't exist
DO $trigger_block$
BEGIN
  -- Create trigger for updating updated_at
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgrelid = 'seller_applications'::regclass
    AND tgname = 'set_updated_at'
  ) THEN
    EXECUTE 'CREATE TRIGGER set_updated_at
      BEFORE UPDATE ON seller_applications
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()';
    
    RAISE NOTICE 'Created set_updated_at trigger on seller_applications';
  END IF;

  -- Check if the trigger exists and create it if not
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgrelid = 'seller_applications'::regclass
    AND tgname = 'on_seller_application_approved'
  ) THEN
    EXECUTE 'CREATE TRIGGER on_seller_application_approved
      BEFORE UPDATE ON seller_applications
      FOR EACH ROW
      EXECUTE FUNCTION handle_seller_application_approval()';
    
    RAISE NOTICE 'Created on_seller_application_approved trigger';
  END IF;
END $trigger_block$;

-- Create indexes and policies
DO $indexes_policies$
BEGIN
  -- Create indexes for faster queries if they don't exist
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE tablename = 'seller_applications'
    AND indexname = 'idx_seller_applications_user_id'
  ) THEN
    CREATE INDEX idx_seller_applications_user_id ON seller_applications(user_id);
    RAISE NOTICE 'Created index on user_id';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE tablename = 'seller_applications'
    AND indexname = 'idx_seller_applications_status'
  ) THEN
    CREATE INDEX idx_seller_applications_status ON seller_applications(status);
    RAISE NOTICE 'Created index on status';
  END IF;

  -- Check and create RLS policies
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
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'seller_applications'
    AND policyname = 'Users can create applications'
  ) THEN
    -- Users can insert their own applications
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
  END IF;

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
  END IF;

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
  END IF;
END $indexes_policies$;

-- Add FK constraint for user_id if it doesn't exist
DO $fk_constraint$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu 
    ON tc.constraint_name = ccu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'seller_applications'
    AND tc.table_schema = 'public'
    AND ccu.column_name = 'user_id'
  ) THEN
    -- Attempt to add the constraint, this might fail if there are NULL values
    BEGIN
      ALTER TABLE seller_applications 
      ADD CONSTRAINT seller_applications_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
      
      RAISE NOTICE 'Added foreign key constraint on user_id';
    EXCEPTION
      WHEN others THEN
        RAISE NOTICE 'Could not add foreign key constraint: %', SQLERRM;
    END;
  END IF;
END $fk_constraint$;

-- Run ANALYZE to update the statistics and schema cache
ANALYZE seller_applications;

-- Final message
DO $final$
BEGIN
  RAISE NOTICE 'Schema update completed successfully';
END $final$;

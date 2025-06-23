-- Prepare for seller application testing
-- Make sure seller_applications table is accessible

-- Step 1: Check if seller_applications table has RLS enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'seller_applications' AND schemaname = 'public';

-- Step 2: Check existing policies on seller_applications
SELECT 
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'seller_applications';

-- Step 3: Optional - Disable RLS on seller_applications too if needed
-- (Uncomment if you get permission errors during testing)

-- ALTER TABLE public.seller_applications DISABLE ROW LEVEL SECURITY;

-- Step 4: Test table access
SELECT 
  'seller_applications test:' as test,
  COUNT(*) as total_applications
FROM public.seller_applications;

-- Step 5: Check if the table structure is correct
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'seller_applications' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

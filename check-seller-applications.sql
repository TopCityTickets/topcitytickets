-- Check Seller Applications
-- Run this in Supabase SQL Editor to see if there are any pending applications

-- 1. Check if seller_applications table exists and its structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'seller_applications'
ORDER BY ordinal_position;

-- 2. Check all seller applications
SELECT 
  id,
  user_id,
  status,
  applied_at,
  created_at,
  reviewed_at,
  notes
FROM public.seller_applications 
ORDER BY created_at DESC;

-- 3. Check pending applications specifically
SELECT 
  sa.id,
  sa.user_id,
  sa.status,
  sa.applied_at,
  sa.created_at,
  u.email as user_email
FROM public.seller_applications sa
LEFT JOIN public.users u ON sa.user_id = u.id
WHERE sa.status = 'pending'
ORDER BY sa.created_at DESC;

-- 4. Count applications by status
SELECT 
  status,
  count(*) as count
FROM public.seller_applications
GROUP BY status;

SELECT 'Seller applications check complete!' as result;

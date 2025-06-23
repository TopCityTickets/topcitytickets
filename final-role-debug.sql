-- FINAL DIAGNOSTIC - Let's see what's REALLY in the database
-- Use your exact UUID

-- 1. Check EXACTLY what's in public.users for your ID
SELECT 
  'EXACT RECORD' as check_type,
  id,
  email,
  role,
  created_at,
  updated_at,
  LENGTH(role) as role_length,
  ASCII(SUBSTRING(role, 1, 1)) as first_char_ascii
FROM public.users 
WHERE id = 'c09e0cbf-bb61-44bf-a4f4-7cb59fb1727c';

-- 2. Check for ANY records with your email
SELECT 
  'ALL EMAIL RECORDS' as check_type,
  id,
  email,
  role,
  created_at,
  CASE WHEN id = 'c09e0cbf-bb61-44bf-a4f4-7cb59fb1727c' THEN 'CORRECT ID' ELSE 'WRONG ID' END as id_match
FROM public.users 
WHERE email = 'topcitytickets@gmail.com';

-- 3. See what a simple query returns (what the app might be getting)
SELECT 
  'SIMPLE QUERY RESULT' as check_type,
  id,
  email,
  role
FROM public.users 
WHERE email = 'topcitytickets@gmail.com'
ORDER BY created_at
LIMIT 1;

-- 4. Check if there are hidden characters or case issues
SELECT 
  'ROLE ANALYSIS' as check_type,
  role,
  LENGTH(role) as length,
  TRIM(role) as trimmed_role,
  LOWER(role) as lower_role,
  role = 'admin' as exact_match,
  TRIM(LOWER(role)) = 'admin' as clean_match
FROM public.users 
WHERE id = 'c09e0cbf-bb61-44bf-a4f4-7cb59fb1727c';

-- 5. Force update with clean data
UPDATE public.users 
SET 
  role = 'admin',
  updated_at = NOW()
WHERE id = 'c09e0cbf-bb61-44bf-a4f4-7cb59fb1727c';

-- 6. Final verification
SELECT 
  'AFTER FORCED UPDATE' as check_type,
  id,
  email,
  role,
  updated_at,
  'Should be admin now' as note
FROM public.users 
WHERE id = 'c09e0cbf-bb61-44bf-a4f4-7cb59fb1727c';

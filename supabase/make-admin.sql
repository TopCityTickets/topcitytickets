-- SQL to Make Yourself Admin in TopCityTickets
-- Run this in your Supabase SQL Editor
-- REPLACE 'your-email@example.com' with your actual email address

-- Option 1: If you already have an account, update your role to admin
UPDATE users 
SET role = 'admin', 
    updated_at = NOW()
WHERE email = 'your-email@example.com';

-- Option 2: If you don't have an account yet, insert yourself as admin
-- (You'll still need to sign up through the app first, then run Option 1)

-- Option 3: Make ALL users with a specific email domain admins (if you own the domain)
-- UPDATE users 
-- SET role = 'admin', 
--     updated_at = NOW()
-- WHERE email LIKE '%@yourdomain.com';

-- Option 4: Check your current user data
SELECT id, email, role, created_at, updated_at 
FROM users 
WHERE email = 'your-email@example.com';

-- Option 5: See all users and their roles
SELECT id, email, role, created_at 
FROM users 
ORDER BY created_at DESC;

/*
INSTRUCTIONS:
1. Go to your Supabase Dashboard
2. Click "SQL Editor" in the sidebar
3. Replace 'your-email@example.com' with your actual email
4. Run the UPDATE query (Option 1)
5. Check with Option 4 to confirm you're now an admin

ROLES AVAILABLE:
- 'user' (default)
- 'seller' 
- 'admin'
*/

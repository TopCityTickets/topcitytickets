-- Check if topcitytickets@gmail.com exists and their current role
SELECT id, email, role FROM users WHERE email = 'topcitytickets@gmail.com';

-- If the user doesn't exist, insert them as admin
-- (You'll need to sign up with this email first, then run the update below)

-- Update existing user to admin role
UPDATE users 
SET role = 'admin' 
WHERE email = 'topcitytickets@gmail.com';

-- Verify the update
SELECT id, email, role FROM users WHERE email = 'topcitytickets@gmail.com';

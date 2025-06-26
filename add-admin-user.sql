-- Quick script to add yourself as admin
-- First, find your user ID by running this:
SELECT id, email FROM auth.users;

-- Then replace 'YOUR_USER_ID_HERE' with your actual ID and run:
-- INSERT INTO public.user_roles (user_id, role) VALUES ('YOUR_USER_ID_HERE', 'admin');

-- Or if you want to add ALL current users as admin temporarily:
INSERT INTO public.user_roles (user_id, role) 
SELECT id, 'admin' 
FROM auth.users 
ON CONFLICT (user_id, role) DO NOTHING;

SELECT 'All users added as admin!' as result;

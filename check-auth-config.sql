-- Check and Update Supabase Auth Configuration
-- Run this in your Supabase SQL Editor to check auth settings

-- Check current auth configuration
SELECT 
    name,
    value
FROM auth.config 
WHERE name IN (
    'SITE_URL',
    'ADDITIONAL_REDIRECT_URLS',
    'DISABLE_SIGNUP',
    'EMAIL_CONFIRM_REDIRECT_URL'
)
ORDER BY name;

-- If you need to update the site URL and redirect URLs, use these commands:
-- (Replace with your actual domain)

-- UPDATE auth.config 
-- SET value = 'https://topcitytickets.org' 
-- WHERE name = 'SITE_URL';

-- UPDATE auth.config 
-- SET value = 'https://topcitytickets.org/auth/callback,https://topcitytickets.org' 
-- WHERE name = 'ADDITIONAL_REDIRECT_URLS';

-- Show the results
SELECT 'Auth configuration checked' as status;

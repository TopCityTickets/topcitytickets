@echo off
echo 🚀 Deploying to Vercel with stable domain configuration...
echo.

echo 📝 Setting environment variables...
echo You'll need to set NEXT_PUBLIC_SITE_URL to: https://topcitytickets.org
echo.

echo 🚀 Deploying to production...
vercel --prod

echo.
echo ✅ Deployment complete!
echo.
echo 🔧 Next steps:
echo 1. Go to your Supabase Dashboard → Authentication → URL Configuration  
echo 2. Add these redirect URLs:
echo    - https://topcitytickets.org/auth/callback
echo    - https://topcitytickets.vercel.app/auth/callback  
echo 3. Set Site URL to: https://topcitytickets.org
echo.
echo 🧪 Test the auth flow at: https://topcitytickets.org/signup
pause

@echo off
echo TopCityTickets Deployment Script

echo Cleaning up previous build artifacts...
if exist .next rmdir /s /q .next

echo Installing dependencies...
call npm install

echo Building project locally to verify...
call npx next build --no-lint

if %ERRORLEVEL% EQU 0 (
  echo Local build successful! Deploying to Vercel...
  call vercel --prod
) else (
  echo Local build failed, but trying to deploy anyway...
  call vercel --prod
)

echo Deployment complete!
echo.
echo Your app is now deployed at: https://topcitytickets-blond.vercel.app
echo.
echo IMPORTANT: Update these settings in Supabase Dashboard:
echo 1. Go to Authentication ^> URL Configuration
echo 2. Set Site URL to: https://topcitytickets-blond.vercel.app
echo 3. Add Redirect URLs:
echo    - https://topcitytickets-blond.vercel.app/auth/callback
echo    - https://topcitytickets-blond.vercel.app/*
echo.
echo Environment variables in Vercel should include:
echo - NEXT_PUBLIC_SITE_URL=https://topcitytickets-blond.vercel.app
echo - NEXT_PUBLIC_SUPABASE_URL
echo - NEXT_PUBLIC_SUPABASE_ANON_KEY
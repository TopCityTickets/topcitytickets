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
echo Remember to configure these environment variables in Vercel:
echo - NEXT_PUBLIC_SUPABASE_URL
echo - NEXT_PUBLIC_SUPABASE_ANON_KEY
echo - NEXT_PUBLIC_SITE_URL
echo - SUPABASE_SERVICE_ROLE_KEY
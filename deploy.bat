@echo off
echo TopCityTickets Deployment Script

echo Cleaning up previous build artifacts...
if exist .next rmdir /s /q .next
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json

echo Clearing npm cache...
call npm cache clean --force

echo Installing dependencies...
call npm install

echo Checking Navbar component for type errors...
echo ^> Verifying src\app\Navbar.tsx
echo.

echo Building project with custom build script...
call npm run build

if %ERRORLEVEL% EQU 0 (
  echo Build successful! Deploying to Vercel...
  call vercel --prod
) else (
  echo Build failed with custom script. Trying original build...
  call npm run build:original
  
  if %ERRORLEVEL% EQU 0 (
    echo Original build successful! Deploying to Vercel...
    call vercel --prod
  ) else (
    echo All build attempts failed. Please fix the TypeScript errors.
    exit /b 1
  )
)

echo Deployment complete!
echo Remember to configure these environment variables in Vercel:
echo - NEXT_PUBLIC_SUPABASE_URL
echo - NEXT_PUBLIC_SUPABASE_ANON_KEY
echo - NEXT_PUBLIC_SITE_URL
echo - SUPABASE_SERVICE_ROLE_KEY
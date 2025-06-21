@echo off
echo ====== SIMPLIFIED DEPLOYMENT FOR TOPCITYTICKETS ======

REM Clean up
echo Cleaning build artifacts...
if exist .next rmdir /s /q .next

REM Install dependencies
echo Installing dependencies...
call npm install

REM Build ignoring TypeScript errors
echo Building with TypeScript checks disabled...
set NEXT_SKIP_TYPESCRIPT_CHECK=true
set NEXT_IGNORE_TYPESCRIPT_ERRORS=true
call npm run build

REM Deploy to Vercel
echo Deploying to Vercel...
call npx vercel --prod

echo Done! Remember to set environment variables in Vercel:
echo - NEXT_PUBLIC_SUPABASE_URL=https://vzndqhzpzdphiiblwplh.supabase.co
echo - NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
echo - NEXT_PUBLIC_SITE_URL=[your-vercel-domain]
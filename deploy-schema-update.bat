@echo off
echo Starting deployment of TopCityTickets schema updates...

echo Step 1: Clearing npm cache and reinstalling dependencies...
call npm run clean
call npm install

echo Step 2: Building the application...
call npm run build

echo Step 3: Running SQL migration on Supabase...
echo IMPORTANT: Please run the SQL migration script in your Supabase dashboard
echo File: supabase/migrations/002_update_user_schema.sql

echo Step 4: Deploying to Vercel...
echo Run the following command to deploy to Vercel (if using Vercel CLI):
echo vercel deploy --prod --force

echo Deployment steps complete!
echo Please remember to run the SQL migration script in Supabase dashboard.

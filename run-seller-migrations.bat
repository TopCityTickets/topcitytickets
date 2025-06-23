@echo off
echo Running SQL migrations for seller applications...
echo.

echo 1. Creating/ensuring seller_applications table...
psql -h db.xxx.supabase.co -U postgres -d postgres -f supabase\migrations\003_ensure_seller_applications.sql

echo.
echo 2. Creating debug procedures...
psql -h db.xxx.supabase.co -U postgres -d postgres -f supabase\migrations\004_debug_procedures.sql

echo.
echo Migrations complete!
echo.
echo Please replace the database connection details with your actual Supabase details before running.
echo You can run the script directly from the Supabase SQL editor instead if you prefer.
pause

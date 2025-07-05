@echo off
echo Applying RLS recursion fix to Supabase...

REM Set Supabase credentials from .env.local
set SUPABASE_URL=https://nrlvcbiajcdmcnuhunwx.supabase.co
set SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ybHZjYmlhamNkbWNudWh1bnd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTA0ODY4MywiZXhwIjoyMDY2NjI0NjgzfQ.42Vk3eJqI2jrRw6C8gc-42cBpxnfjJ3fvg0YOSajbjo

echo Step 1: Dropping problematic admin policies...
curl -X POST "%SUPABASE_URL%/rest/v1/rpc/exec_sql" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer %SUPABASE_SERVICE_KEY%" ^
  -H "apikey: %SUPABASE_SERVICE_KEY%" ^
  -d "{\"sql\": \"DROP POLICY IF EXISTS \\\"Admins can view all users\\\" ON users;\"}"

echo Step 2: Creating non-recursive admin check function...
curl -X POST "%SUPABASE_URL%/rest/v1/rpc/exec_sql" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer %SUPABASE_SERVICE_KEY%" ^
  -H "apikey: %SUPABASE_SERVICE_KEY%" ^
  -d "{\"sql\": \"CREATE OR REPLACE FUNCTION is_current_user_admin() RETURNS BOOLEAN AS $$ DECLARE user_role text; BEGIN SELECT role INTO user_role FROM users WHERE id = auth.uid() LIMIT 1; RETURN COALESCE(user_role = 'admin', false); EXCEPTION WHEN OTHERS THEN RETURN false; END; $$ LANGUAGE plpgsql SECURITY DEFINER;\"}"

echo Step 3: Creating new non-recursive admin policy...
curl -X POST "%SUPABASE_URL%/rest/v1/rpc/exec_sql" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer %SUPABASE_SERVICE_KEY%" ^
  -H "apikey: %SUPABASE_SERVICE_KEY%" ^
  -d "{\"sql\": \"CREATE POLICY \\\"Admins can view all users\\\" ON users FOR SELECT USING (is_current_user_admin());\"}"

echo RLS fix complete! Testing access...

REM Test if we can now access the users table
curl -X GET "%SUPABASE_URL%/rest/v1/users?select=id,email&limit=1" ^
  -H "Authorization: Bearer %SUPABASE_SERVICE_KEY%" ^
  -H "apikey: %SUPABASE_SERVICE_KEY%"

echo Done!

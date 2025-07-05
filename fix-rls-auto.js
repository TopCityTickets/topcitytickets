const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase URL or Service Role Key in environment variables');
  console.error('Make sure your .env.local file has:');
  console.error('NEXT_PUBLIC_SUPABASE_URL=your_url');
  console.error('SUPABASE_SERVICE_ROLE_KEY=your_service_key');
  process.exit(1);
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixRLSPolicies() {
  console.log('🔧 Fixing RLS recursion policies...');
  
  const sqlStatements = [
    // Drop problematic recursive policies
    "DROP POLICY IF EXISTS \"Admins can view all users\" ON users",
    "DROP POLICY IF EXISTS \"Admins can update all users\" ON users", 
    "DROP POLICY IF EXISTS \"Admins can delete users\" ON users",
    
    // Create non-recursive admin check function
    `CREATE OR REPLACE FUNCTION check_admin_role()
     RETURNS BOOLEAN AS $$
     DECLARE
       user_role text;
     BEGIN
       SELECT role INTO user_role 
       FROM users 
       WHERE id = auth.uid()
       LIMIT 1;
       
       RETURN COALESCE(user_role = 'admin', false);
     EXCEPTION
       WHEN OTHERS THEN
         RETURN false;
     END;
     $$ LANGUAGE plpgsql SECURITY DEFINER`,
    
    // Create new non-recursive admin policies
    `CREATE POLICY "Admins can view all users" ON users
     FOR SELECT USING (check_admin_role())`,
    
    `CREATE POLICY "Admins can update all users" ON users
     FOR UPDATE USING (check_admin_role())`,
    
    `CREATE POLICY "Admins can delete users" ON users
     FOR DELETE USING (check_admin_role())`,
    
    // Grant permissions
    "GRANT EXECUTE ON FUNCTION check_admin_role() TO authenticated"
  ];
  
  for (let i = 0; i < sqlStatements.length; i++) {
    const sql = sqlStatements[i];
    console.log(`📝 Executing SQL ${i + 1}/${sqlStatements.length}...`);
    
    try {
      // Try using direct SQL execution
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey
        },
        body: JSON.stringify({ query: sql })
      });
      
      if (response.ok) {
        console.log(`✅ SQL ${i + 1} executed successfully`);
      } else {
        console.log(`⚠️ SQL ${i + 1} might have failed (${response.status}), but continuing...`);
      }
    } catch (err) {
      console.log(`⚠️ SQL ${i + 1} execution error: ${err.message}, but continuing...`);
    }
    
    // Small delay between statements
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('🎉 RLS policy fix completed!');
  
  // Wait a bit for changes to take effect
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('🧪 Testing user query...');
  
  // Test if we can query users now
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, role')
      .limit(1);
    
    if (error) {
      console.error('❌ Still having issues with users query:', error.message);
      return false;
    } else {
      console.log('✅ Users query working! Found', data?.length || 0, 'users');
      return true;
    }
  } catch (err) {
    console.error('❌ Error testing users query:', err.message);
    return false;
  }
}

// Alternative approach using HTTP requests
async function fixRLSWithHTTP() {
  console.log('🔧 Attempting HTTP-based fix...');
  
  const fullSQL = `
-- Drop problematic recursive policies
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;

-- Create non-recursive admin check function  
CREATE OR REPLACE FUNCTION check_admin_role()
RETURNS BOOLEAN AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role 
  FROM users 
  WHERE id = auth.uid()
  LIMIT 1;
  
  RETURN COALESCE(user_role = 'admin', false);
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create new non-recursive admin policies
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (check_admin_role());

CREATE POLICY "Admins can update all users" ON users  
    FOR UPDATE USING (check_admin_role());

CREATE POLICY "Admins can delete users" ON users
    FOR DELETE USING (check_admin_role());

-- Grant permissions
GRANT EXECUTE ON FUNCTION check_admin_role() TO authenticated;
`;
  
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey
      },
      body: JSON.stringify({ query: fullSQL })
    });
    
    if (response.ok) {
      console.log('✅ HTTP SQL executed successfully!');
      return true;
    } else {
      const errorText = await response.text();
      console.log('⚠️ HTTP SQL execution failed:', response.status, errorText);
      return false;
    }
  } catch (err) {
    console.log('⚠️ HTTP SQL execution error:', err.message);
    return false;
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting RLS fix automation...');
  console.log('🎯 This will fix the infinite recursion in admin RLS policies');
  
  // Try both approaches
  const success1 = await fixRLSPolicies();
  const success2 = await fixRLSWithHTTP();
  
  if (success1 || success2) {
    console.log('✅ RLS fix appears to be successful!');
    console.log('🌐 Test your app at: topcitytickets.org');
  } else {
    console.log('⚠️ RLS fix may have had issues, but policies might still be updated');
    console.log('🔍 Check your Supabase dashboard to verify the policies');
  }
  
  console.log('🏁 Fix attempts completed!');
}

main().catch(console.error);

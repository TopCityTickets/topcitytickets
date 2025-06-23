import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

export async function GET(request: NextRequest) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Get token from query params for debugging
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');
  
  try {
    // Verify environment variables
    const environmentInfo = {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 10) + '...',
      hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasSupabaseJwtSecret: !!process.env.SUPABASE_JWT_SECRET,
      nodeEnv: process.env.NODE_ENV,
    };

    // Get table existence and RLS status
    const adminClient = token 
      ? supabase
      : createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
    
    // Get auth session from token if provided
    let sessionData = null;
    let userData = null;
    
    if (token) {
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      userData = user;
      
      if (userError) {
        return NextResponse.json({
          error: 'Invalid token',
          details: userError,
          environment: environmentInfo,
        }, { status: 401 });
      }
    }

    // Run various checks with the admin client
    const { data: tableExists } = await adminClient.from('seller_applications')
      .select('id')
      .limit(1);

    // Check if RLS is enabled using system tables (requires admin access)
    let rlsStatus;
    try {
      const { data: rls } = await adminClient
        .rpc('get_table_rls_status', { input_table_name: 'seller_applications' });
      rlsStatus = rls;
    } catch (error) {
      rlsStatus = { error: 'Failed to get RLS status' };
    }

    // Check policies on the table
    let policies;
    try {
      const { data: policyData } = await adminClient
        .rpc('get_table_policies', { input_table_name: 'seller_applications' });
      policies = policyData;
    } catch (error) {
      policies = { error: 'Failed to get policies' };
    }    // Check for actual applications if user data is available
    let applications: any = [];
    if (userData?.id) {
      const { data: userApps } = await adminClient
        .from('seller_applications')
        .select('*')
        .eq('user_id', userData.id);
      applications = userApps || [];
    } else {
      // Just get a count if no specific user
      const { count } = await adminClient
        .from('seller_applications')
        .select('*', { count: 'exact', head: true });
      applications = { count: count || 0 };
    }

    // Check trigger existence
    let triggerExists;
    try {
      const { data: trigger } = await adminClient
        .rpc('check_trigger_exists', { 
          trigger_name: 'on_seller_application_approved',
          table_name: 'seller_applications'
        });
      triggerExists = trigger;
    } catch (error) {
      triggerExists = { error: 'Failed to check trigger' };
    }

    return NextResponse.json({
      environment: environmentInfo,
      authenticated: !!userData,
      user: userData,
      tableInfo: {
        sellerApplicationsExists: tableExists !== null,
        rowsReturned: tableExists?.length || 0,
      },
      rlsEnabled: rlsStatus,
      policies: policies,
      applications: applications,
      triggerStatus: triggerExists,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Server error during debug',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Helper function for SQL stored procedures needed for checking table status
export async function POST(request: NextRequest) {
  // Only allow in development mode
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({
      error: 'This endpoint is only available in development mode',
    }, { status: 403 });
  }

  try {
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Create helper procedures for debugging
    await adminClient.rpc('create_debug_procedures');

    return NextResponse.json({
      success: true,
      message: 'Debug procedures created',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to create debug procedures',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

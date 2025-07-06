import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client with service role
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false }
      }
    );

    console.log('🔍 DEBUG: Checking all tables for seller data...');

    // Check users table for pending seller status
    const { data: pendingUsers, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('seller_status', 'pending');

    console.log('🔍 Users with pending seller_status:', pendingUsers?.length || 0);
    
    // Check seller_applications table for all records
    const { data: sellerApps, error: appsError } = await supabase
      .from('seller_applications')
      .select('*');

    console.log('🔍 Records in seller_applications table:', sellerApps?.length || 0);

    // Check users table for any seller-related data
    const { data: allUsersWithSellerData, error: allUsersError } = await supabase
      .from('users')
      .select('id, email, seller_status, seller_business_name, seller_applied_at, created_at')
      .not('seller_business_name', 'is', null);

    console.log('🔍 Users with any seller data:', allUsersWithSellerData?.length || 0);

    // Check for users who applied but don't have pending status
    const { data: nonPendingSellerUsers, error: nonPendingError } = await supabase
      .from('users')
      .select('id, email, seller_status, seller_business_name, seller_applied_at')
      .not('seller_applied_at', 'is', null)
      .neq('seller_status', 'pending');

    console.log('🔍 Users who applied but are not pending:', nonPendingSellerUsers?.length || 0);

    if (usersError || appsError || allUsersError || nonPendingError) {
      console.error('🔍 Query errors:', { usersError, appsError, allUsersError, nonPendingError });
    }

    return NextResponse.json({
      success: true,
      debug: {
        pendingUsers: pendingUsers || [],
        sellerApplications: sellerApps || [],
        usersWithSellerData: allUsersWithSellerData || [],
        nonPendingSellerUsers: nonPendingSellerUsers || [],
        counts: {
          pendingUsers: pendingUsers?.length || 0,
          sellerApplications: sellerApps?.length || 0,
          usersWithSellerData: allUsersWithSellerData?.length || 0,
          nonPendingSellerUsers: nonPendingSellerUsers?.length || 0
        }
      }
    });

  } catch (error: any) {
    console.error('🔍 DEBUG error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

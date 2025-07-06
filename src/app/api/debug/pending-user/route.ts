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

    console.log('🔍 DETAILED: Checking pending user record...');

    // Get the exact pending user record with ALL fields
    const { data: pendingUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('seller_status', 'pending')
      .single();

    console.log('🔍 Pending user record:', pendingUser);
    console.log('🔍 User error:', userError);

    // Test the exact query that the admin dashboard uses
    const { data: adminQuery, error: adminError } = await supabase
      .from('users')
      .select(`
        id, 
        email, 
        first_name, 
        last_name, 
        seller_business_name,
        seller_business_type,
        seller_description,
        seller_contact_email,
        seller_contact_phone,
        website_url,
        seller_applied_at
      `)
      .eq('seller_status', 'pending')
      .order('seller_applied_at', { ascending: true });

    console.log('🔍 Admin query result:', adminQuery);
    console.log('🔍 Admin query error:', adminError);

    return NextResponse.json({
      success: true,
      data: {
        pendingUserRaw: pendingUser,
        adminQueryResult: adminQuery,
        errors: {
          userError,
          adminError
        },
        analysis: {
          hasBusinessName: !!pendingUser?.seller_business_name,
          hasAppliedAt: !!pendingUser?.seller_applied_at,
          missingFields: {
            seller_business_name: !pendingUser?.seller_business_name,
            seller_business_type: !pendingUser?.seller_business_type,
            seller_contact_email: !pendingUser?.seller_contact_email,
            seller_applied_at: !pendingUser?.seller_applied_at
          }
        }
      }
    });

  } catch (error: any) {
    console.error('🔍 DETAILED DEBUG error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

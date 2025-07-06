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

    console.log('🔍 Testing admin query...');

    // Test the exact same query as the admin dashboard
    const { data: sellerApps, error: sellerError } = await supabase
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

    console.log('🔍 Admin query result:', { sellerApps, sellerError });

    // Also test a simpler query to see if the basic data is there
    const { data: simpleQuery, error: simpleError } = await supabase
      .from('users')
      .select('id, email, seller_status, seller_business_name')
      .eq('seller_status', 'pending');

    console.log('🔍 Simple query result:', { simpleQuery, simpleError });

    // Test an even simpler query
    const { data: basicQuery, error: basicError } = await supabase
      .from('users')
      .select('*')
      .eq('seller_status', 'pending');

    console.log('🔍 Basic query result:', { basicQuery, basicError });

    return NextResponse.json({
      success: true,
      data: {
        adminQuery: {
          data: sellerApps,
          error: sellerError,
          count: sellerApps?.length || 0
        },
        simpleQuery: {
          data: simpleQuery,
          error: simpleError,
          count: simpleQuery?.length || 0
        },
        basicQuery: {
          data: basicQuery,
          error: basicError,
          count: basicQuery?.length || 0
        }
      }
    });

  } catch (error: any) {
    console.error('🔍 Test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

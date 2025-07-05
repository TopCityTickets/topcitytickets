import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('=== SELLER APPLICATION STATUS CHECK ===');
    
    // Get the current user using server-side authentication
    const supabaseClient = createClient();
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.log('❌ Auth error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated:', user.email);

    // Check for existing seller application
    const { data: application, error: appError } = await supabaseClient
      .from('seller_applications')
      .select('*')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (appError && appError.code !== 'PGRST116') {
      console.error('❌ Database error:', appError);
      return NextResponse.json(
        { error: 'Database error', details: appError.message },
        { status: 500 }
      );
    }

    // If no application found (PGRST116 is "no rows returned")
    if (appError && appError.code === 'PGRST116') {
      console.log('ℹ️ No seller application found for user');
      return NextResponse.json({
        hasApplication: false,
        application: null
      });
    }

    console.log('✅ Application found:', application?.status);
    return NextResponse.json({
      hasApplication: true,
      application: application
    });

  } catch (error: any) {
    console.error('❌ Seller application status check error:', error);
    return NextResponse.json(
      { error: `Status check failed: ${error.message}` },
      { status: 500 }
    );
  }
}

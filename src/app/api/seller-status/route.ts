import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic';

/**
 * Simplified Seller Status API
 * Gets seller application status and data from the users table only
 */
export async function GET(request: NextRequest) {
  try {
    console.log('=== SELLER STATUS CHECK ===');
    
    // Get the current user using server-side authentication
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.log('❌ Auth error:', userError);
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
        timestamp: new Date().toISOString()
      }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.email);

    // Get user data with seller application information
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        role,
        seller_status,
        seller_business_name,
        seller_business_type,
        seller_description,
        seller_contact_email,
        seller_contact_phone,
        seller_applied_at,
        seller_approved_at,
        seller_denied_at,
        can_reapply_at,
        admin_notes,
        website_url
      `)
      .eq('id', user.id)
      .single();

    if (userDataError) {
      console.error('❌ Database error:', userDataError);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        details: userDataError.message,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    // Calculate application status and permissions
    const now = new Date();
    const canReapplyAt = userData.can_reapply_at ? new Date(userData.can_reapply_at) : null;
    
    // User can apply if:
    // 1. They haven't applied before (seller_status is 'none' or null)
    // 2. They were denied but the reapply period has passed
    const canApply = !userData.seller_status || 
                    userData.seller_status === 'none' || 
                    (userData.seller_status === 'denied' && (!canReapplyAt || canReapplyAt <= now));

    let daysUntilReapply = null;
    if (userData.seller_status === 'denied' && canReapplyAt && canReapplyAt > now) {
      daysUntilReapply = Math.ceil((canReapplyAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }

    const hasApplication = userData.seller_status && userData.seller_status !== 'none';
    const isSeller = userData.role === 'seller' && userData.seller_status === 'approved';

    console.log('✅ Status check complete:', { 
      status: userData.seller_status, 
      canApply, 
      isSeller 
    });

    return NextResponse.json({
      success: true,
      data: {
        user: userData,
        status: {
          seller_status: userData.seller_status || 'none',
          can_apply: canApply,
          has_application: hasApplication,
          is_seller: isSeller,
          days_until_reapply: daysUntilReapply
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Seller status check error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic';

/**
 * Simplified Seller Application API
 * Uses only the users table as source of truth for seller status and application data
 */
export async function POST(request: NextRequest) {
  try {
    console.log('=== SIMPLIFIED SELLER APPLICATION ===');
    
    // Parse the request body with better error handling
    let body;
    try {
      body = await request.json();
      console.log('📝 Request body received:', {
        keys: Object.keys(body),
        businessName: body.businessName ? 'present' : 'missing',
        businessType: body.businessType ? 'present' : 'missing',
        contactEmail: body.contactEmail ? 'present' : 'missing'
      });
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      return NextResponse.json({
        success: false,
        error: 'Invalid JSON in request body',
        message: 'Please check your request format and try again',
        details: parseError instanceof Error ? parseError.message : 'Unknown parse error',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    const { businessName, businessType, businessDescription, contactEmail, contactPhone, websiteUrl } = body;

    // Validate required fields with detailed feedback
    const missingFields = [];
    if (!businessName || businessName.trim() === '') missingFields.push('businessName');
    if (!businessType || businessType.trim() === '') missingFields.push('businessType');
    if (!contactEmail || contactEmail.trim() === '') missingFields.push('contactEmail');

    if (missingFields.length > 0) {
      console.log('❌ Missing required fields:', missingFields);
      return NextResponse.json({
        success: false,
        error: 'Missing required fields',
        message: `Please provide: ${missingFields.join(', ')}`,
        missingFields,
        receivedFields: Object.keys(body),
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail)) {
      console.log('❌ Invalid email format:', contactEmail);
      return NextResponse.json({
        success: false,
        error: 'Invalid email format',
        message: 'Please provide a valid email address',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Get the current user using server-side authentication
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.log('❌ Auth error:', userError);
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
        message: 'Please sign in to submit a seller application',
        details: userError?.message,
        timestamp: new Date().toISOString()
      }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.email);
    console.log('🔍 Checking user seller status...');
    
    // Get current user data to check existing application status
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('seller_status, seller_applied_at, can_reapply_at')
      .eq('id', user.id)
      .single();

    if (userDataError) {
      console.error('❌ Error fetching user data:', userDataError);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        details: userDataError.message,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    console.log('📊 Current user seller status:', userData?.seller_status || 'none');

    // Check if user can apply
    const now = new Date();
    const canReapplyAt = userData.can_reapply_at ? new Date(userData.can_reapply_at) : null;
    
    // User can apply if:
    // 1. They haven't applied before (seller_status is 'none' or null)
    // 2. They were denied but the reapply period has passed
    const canApply = !userData.seller_status || 
                    userData.seller_status === 'none' || 
                    (userData.seller_status === 'denied' && (!canReapplyAt || canReapplyAt <= now));

    if (!canApply) {
      let message = 'You already have a seller application on file';
      if (userData.seller_status === 'pending') {
        message = 'Your seller application is currently pending review';
      } else if (userData.seller_status === 'approved') {
        message = 'You are already an approved seller';
      } else if (userData.seller_status === 'denied' && canReapplyAt && canReapplyAt > now) {
        const daysUntilReapply = Math.ceil((canReapplyAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        message = `You can reapply in ${daysUntilReapply} days`;
      }

      return NextResponse.json({
        success: false,
        error: 'Cannot apply',
        message,
        currentStatus: userData.seller_status,
        canReapplyAt: userData.can_reapply_at,
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Update user record with seller application data
    const applicationData = {
      seller_status: 'pending' as const,
      seller_business_name: businessName,
      seller_business_type: businessType,
      seller_description: businessDescription || null,
      seller_contact_email: contactEmail,
      seller_contact_phone: contactPhone || null,
      website_url: websiteUrl || null,
      seller_applied_at: new Date().toISOString(),
      seller_approved_at: null,
      seller_denied_at: null,
      can_reapply_at: null,
      admin_notes: null,
      updated_at: new Date().toISOString()
    };
    
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(applicationData)
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update user with application data:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Failed to submit seller application',
        details: updateError.message,
        code: updateError.code,
        hint: updateError.hint,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    console.log('✅ Seller application submitted successfully');

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'Seller application submitted successfully! You will receive an email once it is reviewed.',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Seller application error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('=== DEBUG: TESTING SELLER APPLICATION ===');
    
    // Parse body
    let body;
    try {
      body = await request.json();
      console.log('📝 Request body received:', body);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      return NextResponse.json({
        success: false,
        error: 'Invalid JSON in request body',
        details: parseError instanceof Error ? parseError.message : 'Unknown parse error'
      }, { status: 400 });
    }

    // Test Supabase connection
    const supabase = createClient();
    
    // Test auth
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('🔐 Auth test:', { user: user?.email, error: userError?.message });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'No authenticated user',
        authError: userError?.message
      }, { status: 401 });
    }

    // Test database connection
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select('id, email, seller_status, role')
      .eq('id', user.id)
      .single();

    console.log('🗄️ Database test:', { userData, error: dbError?.message });

    if (dbError) {
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        dbError: dbError.message,
        code: dbError.code
      }, { status: 500 });
    }

    // Test the actual seller application logic
    const { businessName, businessType, businessDescription, contactEmail, contactPhone, websiteUrl } = body;

    // Validate required fields
    const missingFields = [];
    if (!businessName) missingFields.push('businessName');
    if (!businessType) missingFields.push('businessType');
    if (!contactEmail) missingFields.push('contactEmail');

    if (missingFields.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields',
        missingFields,
        receivedFields: Object.keys(body)
      }, { status: 400 });
    }

    // Test update operation
    const applicationData = {
      seller_status: 'pending' as const,
      seller_business_name: businessName,
      seller_business_type: businessType,
      seller_description: businessDescription || null,
      seller_contact_email: contactEmail,
      seller_contact_phone: contactPhone || null,
      website_url: websiteUrl || null,
      seller_applied_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('📝 Attempting to update user with:', applicationData);

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(applicationData)
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Update error:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Failed to update user record',
        details: updateError.message,
        code: updateError.code,
        hint: updateError.hint
      }, { status: 500 });
    }

    console.log('✅ Update successful:', updatedUser);

    return NextResponse.json({
      success: true,
      message: 'Debug seller application test completed successfully',
      data: {
        user: updatedUser,
        originalBody: body,
        applicationData
      }
    });

  } catch (error) {
    console.error('❌ Debug test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Test basic connectivity
    const supabase = createClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    return NextResponse.json({
      success: true,
      message: 'Debug endpoint is working',
      auth: {
        user: user?.email || null,
        error: userError?.message || null
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

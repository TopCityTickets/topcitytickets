import { NextRequest, NextResponse } from 'next/server';
import { createBrowserClient } from '@supabase/ssr';

export async function POST(request: NextRequest) {  try {
    // Get auth token from request headers
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        error: 'Authentication required',
        message: 'Please provide a valid authorization token',
        timestamp: new Date().toISOString()
      }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    // Create client with the token
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Set the session using the token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({
        error: 'Invalid authentication token',
        details: userError?.message,
        timestamp: new Date().toISOString()
      }, { status: 401 });
    }
    
    // Check if the seller_applications table exists with the correct schema
    try {
      // Try to query the table structure
      const { error: structureError } = await supabase
        .from('seller_applications')
        .select('id, user_id, status, applied_at')
        .limit(1);
        
      if (structureError && structureError.message?.includes('column')) {
        return NextResponse.json({
          error: 'Schema mismatch',
          message: 'The seller_applications table schema is outdated. Please run the migration script.',
          details: structureError.message,
          hint: 'Run the SQL script in supabase/migrations/005_fix_seller_applications_columns.sql',
          timestamp: new Date().toISOString()
        }, { status: 500 });
      }
    } catch (error) {
      console.error('Error checking table structure:', error);
    }

    // Check if user already has a pending application
    const { data: existingApplication, error: checkError } = await supabase
      .from('seller_applications')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      return NextResponse.json({
        error: 'Database error checking existing applications',
        details: checkError.message,
        code: checkError.code,
        hint: 'The seller_applications table might not exist or have permission issues',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    if (existingApplication) {
      return NextResponse.json({
        error: 'Application already exists',
        application: existingApplication,
        message: 'You already have a pending seller application',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }    // Try to create the application - handle both old and new schema
    const applicationData: any = {
      user_id: user.id,
      status: 'pending'
    };
    
    // Add applied_at if the column exists
    try {
      applicationData.applied_at = new Date().toISOString();
    } catch (e) {
      // If this fails, the column might not exist yet
      console.warn('Could not set applied_at, column may not exist yet');
    }
    
    const { data: newApplication, error: insertError } = await supabase
      .from('seller_applications')
      .insert(applicationData)
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({
        error: 'Failed to create seller application',
        details: insertError.message,
        code: insertError.code,
        hint: insertError.hint,
        user_id: user.id,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      application: newApplication,
      message: 'Seller application submitted successfully!',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Seller application error:', error);
    return NextResponse.json({
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

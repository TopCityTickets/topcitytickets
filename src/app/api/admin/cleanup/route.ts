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

    // Get all pending applications from both tables
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('seller_status', 'pending');

    const { data: applicationsData, error: applicationsError } = await supabase
      .from('seller_applications')
      .select('*');

    if (usersError || applicationsError) {
      throw new Error(`Query error: ${usersError?.message || applicationsError?.message}`);
    }

    return NextResponse.json({
      success: true,
      data: {
        pendingUsersCount: usersData?.length || 0,
        pendingUsers: usersData || [],
        applicationsCount: applicationsData?.length || 0,
        applications: applicationsData || []
      }
    });

  } catch (error: any) {
    console.error('Cleanup check error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('id');
    const type = searchParams.get('type'); // 'user' or 'application'

    if (!applicationId || !type) {
      return NextResponse.json({
        success: false,
        error: 'Missing id or type parameter'
      }, { status: 400 });
    }

    // Create Supabase client with service role
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false }
      }
    );

    if (type === 'application') {
      // Delete from seller_applications table
      const { error: deleteError } = await supabase
        .from('seller_applications')
        .delete()
        .eq('id', applicationId);

      if (deleteError) {
        throw new Error(`Delete error: ${deleteError.message}`);
      }
    } else if (type === 'user') {
      // Reset user seller status
      const { error: updateError } = await supabase
        .from('users')
        .update({
          seller_status: 'none',
          seller_applied_at: null,
          seller_business_name: null,
          seller_business_type: null,
          seller_description: null,
          seller_contact_email: null,
          seller_contact_phone: null,
          admin_notes: null
        })
        .eq('id', applicationId);

      if (updateError) {
        throw new Error(`Update error: ${updateError.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully cleaned up ${type} record`
    });

  } catch (error: any) {
    console.error('Cleanup error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

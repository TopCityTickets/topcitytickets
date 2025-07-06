import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Create Supabase client with service role
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false }
      }
    );

    console.log('🔧 Fixing old seller submission...');

    // First, get ALL pending users (not just one)
    const { data: pendingUsers, error: getUserError } = await supabase
      .from('users')
      .select('*')
      .eq('seller_status', 'pending');

    if (getUserError) {
      console.error('🔧 Query error:', getUserError);
      return NextResponse.json({
        success: false,
        error: `Query error: ${getUserError.message}`
      }, { status: 500 });
    }

    if (!pendingUsers || pendingUsers.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No pending users found'
      }, { status: 404 });
    }

    console.log(`🔧 Found ${pendingUsers.length} pending users`);

    const results = [];

    // Fix all pending users
    for (const pendingUser of pendingUsers) {
      console.log('🔧 Fixing user:', pendingUser.email);

      // Fix the user record to ensure all required fields are present
      const updateData: any = {
        seller_status: 'pending',
        updated_at: new Date().toISOString()
      };

      // Ensure required fields have default values if missing
      if (!pendingUser.seller_business_name) {
        updateData.seller_business_name = 'Business Name Not Provided';
      }
      if (!pendingUser.seller_business_type) {
        updateData.seller_business_type = 'other';
      }
      if (!pendingUser.seller_contact_email) {
        updateData.seller_contact_email = pendingUser.email;
      }
      if (!pendingUser.seller_applied_at) {
        updateData.seller_applied_at = new Date().toISOString();
      }

      // Update the user record
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', pendingUser.id)
        .select()
        .single();

      if (updateError) {
        console.error('🔧 Update error for user:', pendingUser.email, updateError);
        results.push({
          email: pendingUser.email,
          success: false,
          error: updateError.message
        });
      } else {
        console.log('🔧 User record updated successfully:', pendingUser.email);
        results.push({
          email: pendingUser.email,
          success: true
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Fixed ${results.filter(r => r.success).length} of ${results.length} pending submissions`,
      results: results
    });

  } catch (error: any) {
    console.error('🔧 Fix error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

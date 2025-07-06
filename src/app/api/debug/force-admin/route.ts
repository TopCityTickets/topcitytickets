import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { userId = '8884a55e-e5f0-482e-9bc8-bbc415b33bdf' } = await request.json();

    // Create Supabase client with service role for admin operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Update user to admin role using raw SQL
    const { data, error } = await supabase.rpc('set_user_admin', {
      user_id: userId
    });

    if (error) {
      // Try direct update instead
      const { data: updateResult, error: updateError } = await supabase
        .from('users')
        .update({ role: 'admin' })
        .eq('id', userId)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json({
          success: false,
          error: 'Failed to update user role',
          details: updateError.message
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'User role updated to admin',
        data: updateResult
      });
    }

    return NextResponse.json({
      success: true,
      message: 'User role updated to admin via RPC',
      data
    });

  } catch (error) {
    console.error('Admin role update error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

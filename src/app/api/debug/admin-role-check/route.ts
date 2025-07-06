import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || '8884a55e-e5f0-482e-9bc8-bbc415b33bdf';

    // Create Supabase client with service role
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false }
      }
    );

    // Check user's current role
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
        details: userError.message,
        userId
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'User role check completed',
      data: {
        userId: user.id,
        email: user.email,
        role: user.role,
        isAdmin: user.role === 'admin',
        sellerStatus: user.seller_status,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    });

  } catch (error) {
    console.error('Admin role check error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, role } = await request.json();
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID required'
      }, { status: 400 });
    }

    const validRoles = ['customer', 'seller', 'admin'];
    if (!role || !validRoles.includes(role)) {
      return NextResponse.json({
        success: false,
        error: 'Valid role required',
        validRoles
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

    // Update user role
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ 
        role: role,
        updated_at: new Date().toISOString()
      })
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
      message: `User role updated to ${role}`,
      data: {
        userId: updatedUser.id,
        email: updatedUser.email,
        previousRole: updatedUser.role,
        newRole: role,
        updatedAt: updatedUser.updated_at
      }
    });

  } catch (error) {
    console.error('Role update error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

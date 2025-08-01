import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if current user is admin
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get user by email (this requires service role)
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      return NextResponse.json({ 
        error: 'Unable to fetch users',
        details: userError.message
      }, { status: 500 });
    }

    const targetUser = userData.users.find(u => u.email === email);
    
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is unverified
    if (targetUser.email_confirmed_at) {
      return NextResponse.json({ 
        error: 'User is already verified',
        user: {
          id: targetUser.id,
          email: targetUser.email,
          verified: true,
          created_at: targetUser.created_at
        }
      }, { status: 400 });
    }

    // Delete the unverified user
    const { error: deleteError } = await supabase.auth.admin.deleteUser(targetUser.id);
    
    if (deleteError) {
      return NextResponse.json({ 
        error: 'Failed to delete user',
        details: deleteError.message
      }, { status: 500 });
    }

    // Also clean up any profile data
    await supabase
      .from('profiles')
      .delete()
      .eq('id', targetUser.id);

    return NextResponse.json({ 
      success: true, 
      message: `Unverified user ${email} has been removed. They can now sign up again.`,
      deletedUser: {
        id: targetUser.id,
        email: targetUser.email,
        created_at: targetUser.created_at
      }
    });

  } catch (error) {
    console.error('Cleanup user API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get current session first to make sure we have an authenticated user to work with
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return NextResponse.json({
        error: 'No authenticated user found',
        details: sessionError?.message || 'No session',
        timestamp: new Date().toISOString()
      }, { status: 401 });
    }

    const user = session.user;
    
    // Check if this user exists in public.users
    const { data: publicUser, error: publicError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (publicError && publicError.code === 'PGRST116') {
      // User doesn't exist in public.users, let's create them
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email!,
          role: 'user',
          created_at: user.created_at
        })
        .select()
        .single();

      if (insertError) {
        return NextResponse.json({
          error: 'Failed to create user record',
          details: insertError.message,
          user_id: user.id,
          email: user.email,
          timestamp: new Date().toISOString()
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        action: 'created_user',
        user: newUser,
        message: 'User record created successfully',
        timestamp: new Date().toISOString()
      });
    }

    if (publicError) {
      return NextResponse.json({
        error: 'Database error',
        details: publicError.message,
        code: publicError.code,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    // User already exists
    return NextResponse.json({
      success: true,
      action: 'user_exists',
      user: publicUser,
      message: 'User record already exists',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Fix user verification error:', error);
    return NextResponse.json({
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

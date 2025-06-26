import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Force dynamic generation for this API route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      return NextResponse.json({
        error: 'Session error',
        details: sessionError.message,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    if (!session?.user) {
      return NextResponse.json({
        error: 'No authenticated user',
        timestamp: new Date().toISOString()
      }, { status: 401 });
    }

    // Check auth.users table
    const { data: authUser, error: authError } = await supabase.auth.getUser();

    // Check public.users table
    const { data: publicUser, error: publicError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();    return NextResponse.json({
      success: true,
      session: {
        user_id: session.user.id,
        email: session.user.email,
        email_confirmed_at: session.user.email_confirmed_at,
        created_at: session.user.created_at,
        access_token: session.access_token
      },
      authUser: authUser?.user ? {
        id: authUser.user.id,
        email: authUser.user.email,
        email_confirmed_at: authUser.user.email_confirmed_at
      } : null,
      authError: authError ? {
        message: authError.message
      } : null,
      publicUser,
      publicError: publicError ? {
        message: publicError.message,
        code: publicError.code,
        hint: publicError.hint
      } : null,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Debug verification error:', error);
    return NextResponse.json({
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

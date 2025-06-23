import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check all users in public.users
    const { data: publicUsers, error: publicError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    // Get current session to see auth state
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    return NextResponse.json({
      success: true,
      currentSession: session ? {
        user_id: session.user.id,
        email: session.user.email,
        email_confirmed_at: session.user.email_confirmed_at,
        created_at: session.user.created_at
      } : null,
      sessionError: sessionError ? {
        message: sessionError.message,
        code: sessionError.code
      } : null,
      publicUsers,
      publicError: publicError ? {
        message: publicError.message,
        code: publicError.code
      } : null,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Debug users error:', error);
    return NextResponse.json({
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

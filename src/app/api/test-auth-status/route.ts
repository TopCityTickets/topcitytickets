import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    // Try to get user role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, role, created_at, updated_at')
      .eq('id', session.user.id)
      .single();

    return NextResponse.json({
      success: true,
      session: {
        user_id: session.user.id,
        email: session.user.email,
      },
      userData,
      userError: userError ? {
        message: userError.message,
        code: userError.code,
        hint: userError.hint
      } : null,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Auth test error:', error);
    return NextResponse.json({
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

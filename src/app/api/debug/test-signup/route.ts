import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName } = await request.json();
    
    console.log('🔧 Debug signup attempt:', { email, firstName, lastName });

    const supabase = createClient();
    
    // Try the signup
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
      }
    });

    console.log('🔧 Signup result:', { data, error });

    return NextResponse.json({
      success: !error,
      data,
      error: error?.message,
      debug: {
        hasUser: !!data.user,
        userConfirmed: data.user?.email_confirmed_at,
        userEmail: data.user?.email
      }
    });

  } catch (err) {
    console.error('🔧 Debug signup error:', err);
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
      debug: 'Server error'
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    console.log('Testing signup for:', email);

    const { data, error } = await supabase().auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${new URL(request.url).origin}/auth/callback`,
        data: { role: 'user' }
      }
    });

    console.log('Signup result:', { data, error });

    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        code: error.status
      }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      user: data.user,
      session: data.session,
      needsConfirmation: !data.session && data.user && !data.user.email_confirmed_at
    });

  } catch (err) {
    console.error('Signup test error:', err);
    return NextResponse.json({ 
      success: false, 
      error: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}

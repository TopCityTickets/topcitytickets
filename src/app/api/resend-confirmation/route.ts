import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    const supabase = createClient();

    // Resend confirmation email with correct URL
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      }
    });

    if (error) {
      return NextResponse.json({
        error: 'Failed to resend confirmation',
        details: error.message
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Confirmation email resent successfully',
      redirectUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
    });

  } catch (error) {
    console.error('Resend confirmation error:', error);
    return NextResponse.json({
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

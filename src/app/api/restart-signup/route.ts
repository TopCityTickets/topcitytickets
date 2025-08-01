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
    
    // First, try to resend verification for existing user
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });

    if (!resendError) {
      return NextResponse.json({ 
        success: true, 
        message: 'Verification email resent successfully',
        action: 'resent'
      });
    }

    // If resend fails, the user might not exist or be in a bad state
    // Try to sign up the user again (this will either work or give us better error info)
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: email,
      password: 'temp-password-will-be-reset', // Temporary password
      options: {
        data: {
          restart_signup: true
        }
      }
    });

    if (signUpError) {
      // If signup also fails, return the specific error
      return NextResponse.json({ 
        error: `Unable to restart signup process: ${signUpError.message}`,
        details: {
          resendError: resendError.message,
          signUpError: signUpError.message
        }
      }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Signup process restarted. Please check your email for verification.',
      action: 'restarted',
      user: signUpData.user ? {
        id: signUpData.user.id,
        email: signUpData.user.email
      } : null
    });

  } catch (error) {
    console.error('Restart signup API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

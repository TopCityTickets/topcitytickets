import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url);
    const { searchParams, origin } = requestUrl;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const error_description = searchParams.get('error_description');
    const next = searchParams.get('next') ?? '/dashboard';

    const supabase = createRouteHandlerClient({ cookies });

    // Handle authentication errors
    if (error) {
      const errorUrl = new URL('/auth/auth-code-error', origin);
      errorUrl.searchParams.set('error', error);
      if (error_description) {
        errorUrl.searchParams.set('error_description', error_description);
      }
      return NextResponse.redirect(errorUrl);
    }

    if (code) {
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (exchangeError) {
        // Handle session exchange errors
        const errorUrl = new URL('/auth/auth-code-error', origin);
        errorUrl.searchParams.set('error', 'session_error');
        errorUrl.searchParams.set('error_description', exchangeError.message);
        return NextResponse.redirect(errorUrl);
      }

      if (data?.user) {
        // If this was an email verification callback or the email is confirmed
        const isEmailVerification = searchParams.get('type') === 'email_verification';
        const isEmailConfirmed = data.user.email_confirmed_at;
        
        if (!isEmailConfirmed && !isEmailVerification) {
          const verifyUrl = new URL('/auth/verify', origin);
          if (data.user.email) {
            verifyUrl.searchParams.set('email', data.user.email);
          }
          return NextResponse.redirect(verifyUrl);
        }

        // Check if this is a new user that needs to complete profile setup
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('setup_completed, role')
          .eq('id', data.user.id)
          .single();

        // Determine final redirect path based on profile status and role
        const finalRedirectPath = !userProfile || !userProfile.setup_completed 
          ? '/welcome'
          : userProfile.role === 'admin'
            ? '/admin/dashboard'
            : userProfile.role === 'seller'
              ? '/seller/dashboard'
              : '/dashboard'; // Default to regular dashboard for users

        return NextResponse.redirect(new URL(finalRedirectPath, origin));
      }
    }

    // If we get here, something went wrong
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=unknown`);
  } catch (error) {
    console.error('Auth callback error:', error);
    const requestUrl = new URL(request.url);
    return NextResponse.redirect(`${requestUrl.origin}/auth/auth-code-error?error=server_error`);
  }
}

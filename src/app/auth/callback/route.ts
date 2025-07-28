import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const { searchParams, origin } = requestUrl;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const error_description = searchParams.get('error_description');
  const next = searchParams.get('next') ?? '/dashboard';

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
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      // Handle session exchange errors
      const errorUrl = new URL('/auth/auth-code-error', origin);
      errorUrl.searchParams.set('error', 'session_error');
      errorUrl.searchParams.set('error_description', error.message);
      return NextResponse.redirect(errorUrl);
    }

    if (data?.user) {
      // Check if email is verified
      if (!data.user.email_confirmed_at) {
        const verifyUrl = new URL('/auth/verify', origin);
        verifyUrl.searchParams.set('email', data.user.email || '');
        return NextResponse.redirect(verifyUrl);
      }

      // Check if this is a new user that needs to complete profile setup
      const { data: profile } = await supabase
        .from('profiles')
        .select('setup_completed')
        .eq('id', data.user.id)
        .single();

      // If no profile or setup not completed, redirect to welcome page
      const redirectPath = (!profile || !profile.setup_completed) ? '/welcome' : next;
      
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';
      
      const baseUrl = isLocalEnv 
        ? origin 
        : forwardedHost 
          ? `https://${forwardedHost}` 
          : origin;

      return NextResponse.redirect(`${baseUrl}${redirectPath}`);
    }
  }

  // If we get here, something went wrong
  return NextResponse.redirect(`${origin}/auth/auth-code-error?error=unknown`);

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}

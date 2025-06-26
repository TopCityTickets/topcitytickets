import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Check if this is a new user by looking at user metadata or creation time
      const { data: { user } } = await supabase.auth.getUser();
      
      // If user was created recently (within last 5 minutes), treat as new user
      const isNewUser = user && new Date(user.created_at).getTime() > Date.now() - 5 * 60 * 1000;
      
      if (isNewUser) {
        // Redirect new users to welcome page
        return NextResponse.redirect(`${origin}/welcome?auth_success=true`);
      }
      
      // Existing users go to dashboard or requested page
      const redirectUrl = new URL(`${origin}${next === '/' ? '/dashboard' : next}`);
      redirectUrl.searchParams.set('auth_success', 'true');
      return NextResponse.redirect(redirectUrl);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}

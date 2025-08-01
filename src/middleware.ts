import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Helper function to check if a path matches any of the routes
const matchesRoute = (path: string, routes: string[]) => {
  return routes.some(route => path.startsWith(route));
};

const PUBLIC_ROUTES = [
  '/',
  '/events',
  '/login',
  '/signup',
  '/auth/callback',
  '/auth/verify',
  '/auth/auth-code-error'
];

const PROTECTED_ROUTES = [
  '/dashboard',
  '/profile',
  '/tickets',
  '/orders'
];

const SELLER_ROUTES = [
  '/seller',
  '/seller/dashboard',
  '/submit-event'  // Submit event is only for sellers
];

const ADMIN_ROUTES = [
  '/admin',
  '/admin/dashboard',
  '/admin/applications',
  '/admin/events'
];

async function middlewareFunction(request: NextRequest) {
  try {
    const res = NextResponse.next();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            res.cookies.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            res.cookies.set({ name, value: '', ...options })
          },
        },
      }
    );
    
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const currentPath = request.nextUrl.pathname;
    const searchParams = request.nextUrl.searchParams;

    // Handle auth errors in URL
    if (searchParams.has('error')) {
      return NextResponse.redirect(new URL('/auth/auth-code-error', request.url));
    }

    // Special handling for auth callback with email verification
    if (currentPath === '/auth/callback' && searchParams.has('type') && searchParams.get('type') === 'email_verification') {
      return res;
    }

    // Always allow public routes
    if (PUBLIC_ROUTES.some(route => currentPath.startsWith(route))) {
      return res;
    }

    // Check authentication for protected routes
    if (!session) {
      if (matchesRoute(currentPath, [...PROTECTED_ROUTES, ...SELLER_ROUTES, ...ADMIN_ROUTES])) {
        const redirectUrl = new URL('/login', request.url);
        redirectUrl.searchParams.set('redirectTo', currentPath);
        return NextResponse.redirect(redirectUrl);
      }
      return res;
    }

    // If user is authenticated, check role-based access
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role, setup_completed')
      .eq('id', session.user.id)
      .single();

    // Redirect to welcome page if profile setup is not completed
    if (!userProfile?.setup_completed && currentPath !== '/welcome') {
      return NextResponse.redirect(new URL('/welcome', request.url));
    }

    // Check role-based access for admin routes
    if (matchesRoute(currentPath, ADMIN_ROUTES) && userProfile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Check role-based access for seller routes
    if (matchesRoute(currentPath, SELLER_ROUTES) && !['seller', 'admin'].includes(userProfile?.role || '')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return res;
  } catch (error) {
    // In case of any error, allow the request to proceed
    // but log the error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Middleware error:', error);
    }
    return NextResponse.next();
  }
}

// Export the middleware function and config
export const middleware = middlewareFunction;export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (they handle their own auth)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ]
};

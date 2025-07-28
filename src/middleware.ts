"use client";

import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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
  '/orders',
  '/submit-event'
];

const SELLER_ROUTES = ['/seller'];
const ADMIN_ROUTES = ['/admin'];

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });
  
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Get the pathname
  const path = request.nextUrl.pathname;

  // Handle auth errors in URL
  const searchParams = request.nextUrl.searchParams;
  if (searchParams.has('error')) {
    return NextResponse.redirect(new URL('/auth/auth-code-error', request.url));
  }

  // Function to check if path starts with any of the routes
  const pathStartsWith = (routes: string[]) => routes.some(route => path.startsWith(route));

  // Allow public routes and static files
  if (pathStartsWith(PUBLIC_ROUTES)) {
    return res;
  }

  // Check if user is authenticated
  if (!session) {
    // Only redirect if trying to access protected routes
    if (pathStartsWith([...PROTECTED_ROUTES, ...SELLER_ROUTES, ...ADMIN_ROUTES])) {
      // Store the attempted URL to redirect after login
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirectTo', path);
      return NextResponse.redirect(redirectUrl);
    }
    return res;
  }

  // Get user role and profile from profiles table
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  const userRole = profile?.role || 'user';

  // Handle role-based access
  if (SELLER_ROUTES.some(route => path.startsWith(route)) && userRole !== 'seller') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (ADMIN_ROUTES.some(route => path.startsWith(route)) && userRole !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Check for first-time login
  if (!profile?.setup_completed && path !== '/welcome') {
    return NextResponse.redirect(new URL('/welcome', request.url));
  }

  return res;
}

export const config = {
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
  ],
};

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createBrowserClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('=== AUTH DEBUG ===');
    
    // Check what cookies are available
    const cookieStore = cookies();
    const allCookies = cookieStore.getAll();
    console.log('Available cookies:', allCookies.map(c => c.name));
    
    // Try server-side authentication
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    console.log('Server-side auth result:', {
      user: user ? { id: user.id, email: user.email } : null,
      error: userError?.message
    });

    return NextResponse.json({
      success: true,
      serverAuth: {
        user: user ? { id: user.id, email: user.email } : null,
        error: userError?.message
      },
      cookies: allCookies.map(c => ({ name: c.name, hasValue: !!c.value })),
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Debug auth error:', error);
    return NextResponse.json(
      { error: `Debug failed: ${error.message}` },
      { status: 500 }
    );
  }
}

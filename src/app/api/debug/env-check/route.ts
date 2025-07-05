import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Test Supabase connection
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Test if we can query the database
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email')
      .limit(1);

    return NextResponse.json({
      success: true,
      message: 'Supabase connection working',
      hasUsers: (users?.length || 0) > 0,
      error: error?.message || null,
      envCheck: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasSiteUrl: !!process.env.NEXT_PUBLIC_SITE_URL,
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL
      }
    });

  } catch (err) {
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
      envCheck: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasSiteUrl: !!process.env.NEXT_PUBLIC_SITE_URL
      }
    }, { status: 500 });
  }
}

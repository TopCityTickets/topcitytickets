import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Test Supabase connection
    const supabaseClient = supabase();
    
    // Try to get current session
    const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
    
    // Check if we can reach Supabase
    const { data: healthCheck, error: healthError } = await supabaseClient
      .from('users')
      .select('count')
      .limit(1);

    return NextResponse.json({
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
      supabase_anon_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
      session_check: sessionError ? `Error: ${sessionError.message}` : 'OK',
      database_check: healthError ? `Error: ${healthError.message}` : 'OK',
      current_user: sessionData.session?.user?.email || 'None'
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to check Supabase connection',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const supabase = createClient();
    
    // Sign out the current user
    await supabase.auth.signOut();
    
    return NextResponse.json({
      success: true,
      message: 'Auth state cleared. Try signing up again with a fresh browser session.'
    });

  } catch (err) {
    return NextResponse.json({
      success: false,
      error: 'Failed to clear auth state'
    }, { status: 500 });
  }
}

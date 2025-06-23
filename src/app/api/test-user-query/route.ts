import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Use the same client setup as the frontend
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'c09e0cbf-bb61-44bf-a4f4-7cb59fb1727c';

    // Test the exact same query the frontend uses
    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    // Also test querying by email
    const { data: emailData, error: emailError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'topcitytickets@gmail.com')
      .single();

    return NextResponse.json({
      success: true,
      byId: {
        data: userData,
        error: error?.message || null
      },
      byEmail: {
        data: emailData,
        error: emailError?.message || null
      },
      userId: userId,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Test failed', 
      details: error?.message 
    }, { status: 500 });
  }
}

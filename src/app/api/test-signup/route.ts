import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    console.log('Testing manual signup for:', email);

    // Use our custom manual signup API with default names for testing
    const response = await fetch(`${new URL(request.url).origin}/api/manual-signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        email, 
        password, 
        firstName: 'Test',
        lastName: 'User'
      }),
    });

    const result = await response.json();
    console.log('Manual signup result:', result);

    if (!response.ok || !result.success) {
      return NextResponse.json({ 
        success: false, 
        error: result.error || 'Signup failed'
      }, { status: response.status });
    }

    return NextResponse.json({ 
      success: true, 
      user_id: result.user_id,
      message: result.message,
      needsConfirmation: false // Manual signup auto-confirms
    });

  } catch (err) {
    console.error('Signup test error:', err);
    return NextResponse.json({ 
      success: false, 
      error: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    console.log('Manual signup attempt for:', email);

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email and password are required'
      }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ 
        success: false, 
        error: 'Password must be at least 6 characters'
      }, { status: 400 });
    }

    // Create Supabase client with service role key to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role key bypasses RLS
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Call our manual signup function
    const { data, error } = await supabase.rpc('manual_signup', {
      user_email: email,
      user_password: password
    });

    console.log('Manual signup result:', { data, error });

    if (error) {
      console.error('Manual signup error:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }

    if (data && typeof data === 'object' && 'success' in data) {
      if (data.success) {
        return NextResponse.json({
          success: true,
          message: data.message || 'Account created successfully!',
          user_id: data.user_id
        });
      } else {
        return NextResponse.json({
          success: false,
          error: data.error || 'Signup failed'
        }, { status: 400 });
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Unexpected response from signup function'
    }, { status: 500 });

  } catch (err) {
    console.error('Manual signup API error:', err);
    return NextResponse.json({ 
      success: false, 
      error: err instanceof Error ? err.message : 'Internal server error'
    }, { status: 500 });
  }
}

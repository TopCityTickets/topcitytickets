import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName } = await request.json();

    console.log('Manual signup attempt for:', email, 'with name:', firstName, lastName);

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email and password are required'
      }, { status: 400 });
    }

    if (!firstName || !lastName) {
      return NextResponse.json({ 
        success: false, 
        error: 'First name and last name are required'
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

    // First check if the user already exists
    const { data: checkData, error: checkError } = await supabase.rpc('check_user_exists', {
      email_to_check: email
    });

    console.log('User check result:', checkData);

    if (checkData?.exists_in_auth && checkData?.exists_in_public) {
      console.log('User already exists in both auth and public tables');
      return NextResponse.json({ 
        success: false, 
        error: 'An account with this email already exists. Please log in instead.' 
      }, { status: 400 });
    }

    // Call our manual signup function
    const { data, error } = await supabase.rpc('manual_signup', {
      user_email: email,
      user_password: password,
      user_first_name: firstName,
      user_last_name: lastName
    });

    console.log('Manual signup result:', { data, error });

    if (error) {
      console.error('Manual signup error:', error);
      
      // Handle common error messages more user-friendly
      if (error.message.includes('violates unique constraint')) {
        return NextResponse.json({ 
          success: false, 
          error: 'An account with this email already exists. Please log in instead.' 
        }, { status: 400 });
      }
      
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

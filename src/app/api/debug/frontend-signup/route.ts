import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('=== FRONTEND SIGNUP DEBUG TEST ===');
    
    const body = await request.json();
    const { email, password, firstName, lastName } = body;

    console.log('📝 Received signup data:', {
      email: email ? 'present' : 'missing',
      password: password ? 'present' : 'missing', 
      firstName: firstName ? 'present' : 'missing',
      lastName: lastName ? 'present' : 'missing',
      passwordLength: password?.length || 0
    });

    // Test environment
    console.log('🔧 Environment check:', {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      serviceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    });

    // Validation
    const errors = [];
    if (!email) errors.push('Email is required');
    if (!password) errors.push('Password is required');
    if (!firstName) errors.push('First name is required');
    if (!lastName) errors.push('Last name is required');
    if (password && password.length < 6) errors.push('Password must be at least 6 characters');

    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: errors,
        step: 'validation'
      }, { status: 400 });
    }

    // Test Supabase client creation
    let supabase;
    try {
      supabase = createClient();
      console.log('✅ Supabase client created');
    } catch (clientError) {
      console.error('❌ Supabase client creation failed:', clientError);
      return NextResponse.json({
        success: false,
        error: 'Failed to create Supabase client',
        details: clientError instanceof Error ? clientError.message : 'Unknown error',
        step: 'client_creation'
      }, { status: 500 });
    }

    // Test if user already exists
    console.log('🔍 Checking if user already exists...');
    const { data: existingUsers } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .limit(1);
      
    if (existingUsers && existingUsers.length > 0) {
      console.log('⚠️ User already exists in public.users');
      return NextResponse.json({
        success: false,
        error: 'User already exists',
        message: 'An account with this email already exists. Please sign in instead.',
        step: 'duplicate_check'
      }, { status: 400 });
    }

    // Test signup
    console.log('📝 Attempting Supabase signup...');
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        }
      }
    });

    console.log('📋 Signup result:', {
      user: !!signupData?.user,
      userId: signupData?.user?.id,
      userEmail: signupData?.user?.email,
      error: signupError?.message
    });

    if (signupError) {
      console.error('❌ Supabase signup error:', signupError);
      return NextResponse.json({
        success: false,
        error: 'Signup failed',
        details: signupError.message,
        code: signupError.code,
        step: 'supabase_signup'
      }, { status: 400 });
    }

    if (!signupData?.user) {
      console.error('❌ No user data returned from signup');
      return NextResponse.json({
        success: false,
        error: 'No user data returned',
        step: 'supabase_signup'
      }, { status: 500 });
    }

    // Check if public.users entry was created by trigger
    console.log('🔍 Checking if public.users entry was created...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second for trigger

    const { data: publicUser, error: publicUserError } = await supabase
      .from('users')
      .select('*')
      .eq('id', signupData.user.id)
      .single();

    console.log('👤 Public user check:', {
      exists: !!publicUser,
      error: publicUserError?.message
    });

    return NextResponse.json({
      success: true,
      message: 'Signup test completed successfully',
      data: {
        authUser: {
          id: signupData.user.id,
          email: signupData.user.email,
          emailConfirmed: !!signupData.user.email_confirmed_at,
          createdAt: signupData.user.created_at
        },
        publicUser: publicUser || null,
        publicUserError: publicUserError?.message || null,
        triggerWorked: !!publicUser
      },
      step: 'complete'
    });

  } catch (error) {
    console.error('❌ Frontend signup debug error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      step: 'server_error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Frontend signup debug endpoint is active',
    instructions: 'Send POST request with { email, password, firstName, lastName }'
  });
}

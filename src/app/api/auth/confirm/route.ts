import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { token, type } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Confirmation token is required' },
        { status: 400 }
      );
    }

    // Create Supabase client with service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false }
      }
    );

    // Find user by confirmation token
    const { data: user, error: userError } = await supabase
      .from('auth.users')
      .select('id, email, email_confirmed_at')
      .eq('confirmation_token', token)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired confirmation token' },
        { status: 400 }
      );
    }

    // Check if already confirmed
    if (user.email_confirmed_at) {
      return NextResponse.json(
        { success: false, error: 'Email is already confirmed. You can sign in to your account.' },
        { status: 400 }
      );
    }

    // Confirm the email
    const { error: confirmError } = await supabase
      .from('auth.users')
      .update({
        email_confirmed_at: new Date().toISOString(),
        confirmation_token: null // Clear the token
      })
      .eq('id', user.id);

    if (confirmError) {
      console.error('Email confirmation error:', confirmError);
      return NextResponse.json(
        { success: false, error: 'Failed to confirm email. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email confirmed successfully! You can now sign in to your account.'
    });

  } catch (error) {
    console.error('Confirmation API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

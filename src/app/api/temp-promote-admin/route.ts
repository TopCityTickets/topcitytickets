import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // Create a service role client to bypass RLS
    const supabaseServiceRole = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // This bypasses RLS
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    console.log('Promoting user to admin:', userId);

    // Update user role using service role (bypasses RLS)
    const { data, error } = await supabaseServiceRole
      .from('users')
      .update({ role: 'admin' })
      .eq('id', userId)
      .select();

    if (error) {
      console.error('Error promoting user to admin:', error);
      return NextResponse.json({ 
        error: 'Failed to promote user', 
        details: error.message 
      }, { status: 500 });
    }

    console.log('Successfully promoted user to admin:', data);

    return NextResponse.json({ 
      success: true, 
      message: 'User promoted to admin successfully',
      user: data[0]
    });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createBrowserClient } from '@supabase/ssr';

export async function POST(request: NextRequest) {
  try {
    // Get auth token from request headers
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        error: 'Authentication required',
        message: 'Please provide a valid authorization token',
        timestamp: new Date().toISOString()
      }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    // Create client with the token
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Set the session using the token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({
        error: 'Invalid authentication token',
        details: userError?.message,
        timestamp: new Date().toISOString()
      }, { status: 401 });
    }

    // For now, let's just update the user's role to 'seller' directly
    // This bypasses the application system temporarily
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ role: 'seller' })
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({
        error: 'Failed to update user role to seller',
        details: updateError.message,
        code: updateError.code,
        hint: updateError.hint,
        user_id: user.id,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'You are now a seller! You can access seller features immediately.',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Seller application error:', error);
    return NextResponse.json({
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

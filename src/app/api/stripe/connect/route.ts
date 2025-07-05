import { NextRequest, NextResponse } from 'next/server';
import { createBrowserClient } from '@supabase/ssr';

export async function POST(request: NextRequest) {
  try {
    // Get auth token from request headers
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        error: 'Authentication required'
      }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    // Create client with the token
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Verify user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({
        error: 'Invalid authentication token'
      }, { status: 401 });
    }

    // Check if user is a seller
    const { data: userData } = await supabase
      .from('users')
      .select('role, stripe_connect_account_id')
      .eq('id', user.id)
      .single();

    if (!userData || userData.role !== 'seller') {
      return NextResponse.json({
        error: 'Only sellers can connect Stripe accounts'
      }, { status: 403 });
    }

    // TODO: Implement actual Stripe Connect integration
    // This would typically:
    // 1. Create a Stripe Connect account if one doesn't exist
    // 2. Generate an onboarding link
    // 3. Return the link for the user to complete setup

    // For now, return a placeholder response
    return NextResponse.json({
      success: true,
      message: 'Stripe Connect integration coming soon!',
      onboarding_url: null
    });

  } catch (error) {
    console.error('Stripe Connect error:', error);
    return NextResponse.json({
      error: 'Server error'
    }, { status: 500 });
  }
}

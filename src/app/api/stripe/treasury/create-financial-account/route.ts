import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';
import { treasuryService } from '@/lib/stripe-treasury';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get the current user (admin)
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseClient = supabase();
    const { data: { user: currentUser }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !currentUser) {
      return NextResponse.json(
        { error: 'Invalid authorization' },
        { status: 401 }
      );
    }

    // Check if current user is admin
    const { data: currentUserData } = await supabaseClient
      .from('users')
      .select('role')
      .eq('id', currentUser.id)
      .single();

    if (currentUserData?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get user details
    const { data: user, error: userError } = await supabaseClient
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user already has a financial account
    if (user.stripe_financial_account_id) {
      return NextResponse.json(
        { error: 'User already has a financial account' },
        { status: 400 }
      );
    }

    // Check if user has a connected account
    if (!user.stripe_connect_account_id) {
      return NextResponse.json(
        { error: 'User must have a connected account before creating financial account' },
        { status: 400 }
      );
    }

    try {
      // Check if Treasury capability is available for this account
      const hasTreasuryCapability = await treasuryService.checkTreasuryCapability(user.stripe_connect_account_id);
      
      if (!hasTreasuryCapability) {
        // Treasury might not be available for all accounts yet
        console.log(`Treasury not available for account ${user.stripe_connect_account_id}`);
        return NextResponse.json(
          { error: 'Treasury capability not available for this account. This may be due to account setup or regional restrictions.' },
          { status: 400 }
        );
      }

      // Create financial account
      const financialAccountId = await treasuryService.createFinancialAccount(
        user.stripe_connect_account_id,
        'topcitytickets'
      );

      // Update user record
      const { error: updateError } = await supabaseClient
        .from('users')
        .update({
          stripe_financial_account_id: financialAccountId,
          stripe_treasury_enabled: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating user record:', updateError);
        return NextResponse.json(
          { error: 'Failed to update user record' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        financialAccountId,
        message: 'Financial account created successfully'
      });

    } catch (treasuryError) {
      console.error('Treasury error:', treasuryError);
      return NextResponse.json(
        { 
          error: 'Failed to create financial account',
          details: treasuryError instanceof Error ? treasuryError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error creating financial account:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

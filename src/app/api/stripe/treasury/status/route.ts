import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';
import { treasuryService } from '@/lib/stripe-treasury';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get the current user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseClient = supabase();
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authorization' },
        { status: 401 }
      );
    }

    // Get user details
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('stripe_connect_account_id, stripe_financial_account_id, stripe_treasury_enabled')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const response = {
      hasConnectedAccount: !!userData.stripe_connect_account_id,
      hasFinancialAccount: !!userData.stripe_financial_account_id,
      treasuryEnabled: userData.stripe_treasury_enabled || false,
      connectedAccountId: userData.stripe_connect_account_id,
      financialAccountId: userData.stripe_financial_account_id
    };

    // If user has a financial account, get the account details
    if (userData.stripe_financial_account_id && userData.stripe_connect_account_id) {
      try {
        const treasuryAccount = await treasuryService.getFinancialAccount(
          userData.stripe_financial_account_id,
          userData.stripe_connect_account_id
        );

        return NextResponse.json({
          ...response,
          treasuryAccount
        });
      } catch (treasuryError) {
        console.error('Error fetching treasury account:', treasuryError);
        // Return basic info even if treasury fetch fails
        return NextResponse.json({
          ...response,
          error: 'Could not fetch treasury account details'
        });
      }
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error checking treasury status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

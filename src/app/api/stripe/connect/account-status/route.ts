import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Stripe from 'stripe';

// Add this to prevent static generation
export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Get the authenticated user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's Stripe Connect account info
    const { data: user } = await supabase
      .from('users')
      .select('stripe_connect_account_id, stripe_connect_enabled, stripe_connect_details_submitted, stripe_connect_charges_enabled, stripe_connect_payouts_enabled')
      .eq('id', session.user.id)
      .single();

    if (!user?.stripe_connect_account_id) {
      return NextResponse.json({ 
        hasAccount: false,
        needsOnboarding: true 
      });
    }

    // Get account status from Stripe
    const account = await stripe.accounts.retrieve(user.stripe_connect_account_id);

    // Update local database with latest status
    const { error: updateError } = await supabase
      .from('users')
      .update({
        stripe_connect_enabled: account.charges_enabled && account.payouts_enabled,
        stripe_connect_details_submitted: account.details_submitted,
        stripe_connect_charges_enabled: account.charges_enabled,
        stripe_connect_payouts_enabled: account.payouts_enabled,
        updated_at: new Date().toISOString()
      })
      .eq('id', session.user.id);

    if (updateError) {
      console.error('Error updating Stripe Connect status:', updateError);
    }

    // Check if onboarding is complete
    const onboardingComplete = account.details_submitted && account.charges_enabled;

    return NextResponse.json({
      hasAccount: true,
      accountId: account.id,
      onboardingComplete,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      requiresAction: !onboardingComplete,
      businessProfile: account.business_profile,
      country: account.country,
      currentlyDue: account.requirements?.currently_due || [],
      eventuallyDue: account.requirements?.eventually_due || []
    });

  } catch (error) {
    console.error('Stripe Connect status check error:', error);
    return NextResponse.json({ 
      error: 'Failed to check account status' 
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

export async function POST(request: NextRequest) {
  try {
    const { eventId, returnUrl } = await request.json();

    // Get the user from the request
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the event and verify it exists
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*, users!created_by(id, email)')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check if seller is the event creator
    if (event.created_by !== user.id) {
      return NextResponse.json({ error: 'Only event creators can set up Stripe Connect' }, { status: 403 });
    }

    // Get or create Stripe Connect account
    const { data: userData } = await supabase
      .from('users')
      .select('stripe_connect_account_id')
      .eq('id', user.id)
      .single();

    let accountId = userData?.stripe_connect_account_id;

    if (!accountId) {
      // Create new Stripe Connect account
      const account = await stripe.accounts.create({
        type: 'express',
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
      });

      accountId = account.id;

      // Save the account ID to the user
      await supabase
        .from('users')
        .update({ stripe_connect_account_id: accountId })
        .eq('id', user.id);

      // Update the event with the account ID
      await supabase
        .from('events')
        .update({ stripe_connect_account_id: accountId })
        .eq('id', eventId);
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXT_PUBLIC_SITE_URL}/seller/dashboard?error=stripe_connect_refresh`,
      return_url: returnUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/seller/dashboard?success=stripe_connect_complete`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ 
      accountLink: accountLink.url,
      accountId 
    });

  } catch (error) {
    console.error('Stripe Connect setup error:', error);
    return NextResponse.json(
      { error: 'Failed to set up Stripe Connect' },
      { status: 500 }
    );
  }
}

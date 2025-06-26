import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Stripe from 'stripe';

// Add this to prevent static generation
export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

export async function POST(request: NextRequest) {
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

    // Check if user is seller or admin
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .single();

    if (!userRole || !['seller', 'admin'].includes(userRole.role)) {
      return NextResponse.json({ error: 'Seller access required' }, { status: 403 });
    }

    // Check if user already has a Stripe Connect account
    const { data: existingUser } = await supabase
      .from('users')
      .select('stripe_connect_account_id, email')
      .eq('id', session.user.id)
      .single();

    if (existingUser?.stripe_connect_account_id) {
      return NextResponse.json({ 
        error: 'Stripe Connect account already exists',
        accountId: existingUser.stripe_connect_account_id 
      }, { status: 400 });
    }

    // Create Stripe Connect account
    const account = await stripe.accounts.create({
      type: 'express',
      email: existingUser?.email || session.user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      metadata: {
        user_id: session.user.id,
        platform: 'topcitytickets'
      }
    });

    // Save the account ID to database
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        stripe_connect_account_id: account.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', session.user.id);

    if (updateError) {
      console.error('Error updating user with Stripe account:', updateError);
      return NextResponse.json({ 
        error: 'Failed to save account information' 
      }, { status: 500 });
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_SITE_URL}/seller/dashboard?setup=refresh`,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/seller/dashboard?setup=complete`,
      type: 'account_onboarding',
    });

    return NextResponse.json({
      success: true,
      accountId: account.id,
      onboardingUrl: accountLink.url
    });

  } catch (error) {
    console.error('Stripe Connect account creation error:', error);
    return NextResponse.json({ 
      error: 'Failed to create Stripe Connect account' 
    }, { status: 500 });
  }
}

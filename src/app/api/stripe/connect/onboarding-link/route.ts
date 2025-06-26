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

    // Get user's Stripe Connect account ID
    const { data: user } = await supabase
      .from('users')
      .select('stripe_connect_account_id')
      .eq('id', session.user.id)
      .single();

    if (!user?.stripe_connect_account_id) {
      return NextResponse.json({ 
        error: 'No Stripe Connect account found' 
      }, { status: 400 });
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: user.stripe_connect_account_id,
      refresh_url: `${process.env.NEXT_PUBLIC_SITE_URL}/seller/dashboard?setup=refresh`,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/seller/dashboard?setup=complete`,
      type: 'account_onboarding',
    });

    return NextResponse.json({
      success: true,
      onboardingUrl: accountLink.url
    });

  } catch (error) {
    console.error('Stripe Connect onboarding link error:', error);
    return NextResponse.json({ 
      error: 'Failed to create onboarding link' 
    }, { status: 500 });
  }
}

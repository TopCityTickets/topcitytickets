import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/utils/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-05-28.basil',
});

const PLATFORM_FEE_PERCENTAGE = parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || '5') / 100;

export async function POST(request: NextRequest) {
  try {
    console.log('=== ENHANCED CHECKOUT DEBUG ===');
    
    const { eventId, paymentMethodId } = await request.json();
    console.log('Event ID:', eventId);
    console.log('Payment Method ID:', paymentMethodId);

    // Get the current user
    const authHeader = request.headers.get('authorization');
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader) {
      console.log('❌ No authorization header');
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Token extracted, length:', token.length);
    
    const supabaseClient = supabase();
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      console.log('❌ Auth error:', authError);
      return NextResponse.json(
        { error: 'Invalid authorization' },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated:', user.email);

    // Get the event details and seller's Stripe Connect account
    const { data: event, error: eventError } = await supabaseClient
      .from('events')
      .select(`
        *,
        creator:users!created_by(
          id,
          email,
          stripe_connect_account_id,
          stripe_connect_enabled
        )
      `)
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      console.log('❌ Event error:', eventError);
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    console.log('✅ Event found:', event.title);
    console.log('Seller Stripe Connect enabled:', event.creator?.stripe_connect_enabled);

    // Check if seller has Stripe Connect set up
    if (!event.creator?.stripe_connect_enabled || !event.creator?.stripe_connect_account_id) {
      return NextResponse.json(
        { error: 'Event seller has not completed payment setup. Please contact the event organizer.' },
        { status: 400 }
      );
    }

    // Get user's Stripe customer ID
    const { data: userData } = await supabaseClient
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    let customerId = userData?.stripe_customer_id;

    // Create customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id },
      });
      
      customerId = customer.id;
      
      await supabaseClient
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    // Calculate fees
    const ticketPrice = parseFloat(event.price);
    const applicationFee = Math.round(ticketPrice * PLATFORM_FEE_PERCENTAGE * 100); // in cents
    const totalAmount = Math.round(ticketPrice * 100); // in cents

    console.log('Price calculations:', {
      ticketPrice,
      applicationFee: applicationFee / 100,
      totalAmount: totalAmount / 100
    });

    // Create or update payment intent
    let paymentIntentParams: Stripe.PaymentIntentCreateParams = {
      amount: totalAmount,
      currency: 'usd',
      customer: customerId,
      application_fee_amount: applicationFee,
      transfer_data: {
        destination: event.creator.stripe_connect_account_id,
      },
      metadata: {
        event_id: eventId,
        user_id: user.id,
        event_name: event.title,
        seller_id: event.created_by,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    };

    // If payment method provided, use it for immediate payment
    if (paymentMethodId) {
      paymentIntentParams.payment_method = paymentMethodId;
      paymentIntentParams.confirm = true;
      paymentIntentParams.return_url = `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`;
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

    // Store payment intent in database
    await supabaseClient
      .from('payment_intents')
      .insert({
        stripe_payment_intent_id: paymentIntent.id,
        user_id: user.id,
        event_id: eventId,
        amount: ticketPrice,
        application_fee: applicationFee / 100,
        currency: 'usd',
        status: paymentIntent.status,
        destination_account_id: event.creator.stripe_connect_account_id,
        client_secret: paymentIntent.client_secret,
      });

    console.log('✅ Payment intent created:', paymentIntent.id);

    if (paymentMethodId && paymentIntent.status === 'succeeded') {
      // Payment was successful, create ticket immediately
      const escrowReleaseDate = new Date();
      escrowReleaseDate.setDate(escrowReleaseDate.getDate() + 1); // 1 day escrow

      const { data: ticket, error: ticketError } = await supabaseClient
        .from('tickets')
        .insert({
          event_id: eventId,
          user_id: user.id,
          stripe_payment_intent_id: paymentIntent.id,
          purchase_amount: ticketPrice,
          application_fee: applicationFee / 100,
          escrow_release_date: escrowReleaseDate.toISOString(),
        })
        .select()
        .single();

      if (ticketError) {
        console.error('❌ Ticket creation error:', ticketError);
      } else {
        console.log('✅ Ticket created:', ticket.id);
      }

      return NextResponse.json({
        success: true,
        payment_intent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
        },
        ticket: ticket || null,
      });
    }

    // Return client secret for frontend confirmation
    return NextResponse.json({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
    });

  } catch (error) {
    console.error('❌ Checkout error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create checkout session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

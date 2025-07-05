import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/utils/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log('Payment completed:', session.id);
      
      // Extract metadata
      const { eventId, userId, userEmail, customerName, isAnonymous } = session.metadata || {};
      
      if (!eventId) {
        console.error('Missing eventId in session:', session.metadata);
        return NextResponse.json(
          { error: 'Missing event data' },
          { status: 400 }
        );
      }

      const isAnonymousPurchase = isAnonymous === 'true';
      console.log('Purchase type:', isAnonymousPurchase ? 'Anonymous' : 'Authenticated');

      if (!isAnonymousPurchase && !userId) {
        console.error('Missing userId for authenticated purchase:', session.metadata);
        return NextResponse.json(
          { error: 'Missing user data for authenticated purchase' },
          { status: 400 }
        );
      }

      if (isAnonymousPurchase && !userEmail) {
        console.error('Missing userEmail for anonymous purchase:', session.metadata);
        return NextResponse.json(
          { error: 'Missing email for anonymous purchase' },
          { status: 400 }
        );
      }

      // Create the ticket in the database
      const supabaseClient = supabase();
      
      const ticketData = {
        event_id: eventId,
        user_id: isAnonymousPurchase ? null : userId,
        customer_email: isAnonymousPurchase ? userEmail : null,
        customer_name: isAnonymousPurchase ? customerName : null,
        stripe_payment_intent_id: session.payment_intent as string,
        purchase_amount: (session.amount_total || 0) / 100, // Convert from cents
        status: 'valid',
      };

      console.log('Creating ticket with data:', ticketData);
      
      const { data: ticket, error: ticketError } = await supabaseClient
        .from('tickets')
        .insert(ticketData)
        .select('*')
        .single();

      if (ticketError) {
        console.error('Error creating ticket:', ticketError);
        return NextResponse.json(
          { error: 'Failed to create ticket' },
          { status: 500 }
        );
      }

      console.log('Ticket created successfully:', ticket);

      // TODO: Send confirmation email here
      
      return NextResponse.json({ 
        success: true, 
        ticketId: ticket.id 
      });
    }

    // Return a response to acknowledge receipt of the event
    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

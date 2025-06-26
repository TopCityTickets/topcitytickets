import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/utils/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-05-28.basil',
});

export async function POST(request: NextRequest) {
  try {
    console.log('=== CREATE CHECKOUT DEBUG ===');
    
    const { eventId } = await request.json();
    console.log('Event ID:', eventId);

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

    // Get the event details
    const { data: event, error: eventError } = await supabaseClient
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      console.log('❌ Event error:', eventError);
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    console.log('✅ Event found:', event.name, 'Price:', event.ticket_price);

    // Validate ticket price
    if (!event.ticket_price || event.ticket_price <= 0) {
      console.log('❌ Invalid ticket price:', event.ticket_price);
      return NextResponse.json(
        { error: 'Event does not have a valid ticket price' },
        { status: 400 }
      );
    }    // Check if user already has a ticket for this event
    const { data: existingTickets, error: ticketError } = await supabaseClient
      .from('tickets')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .eq('status', 'valid')
      .limit(1);

    if (ticketError) {
      console.warn('Error checking existing tickets:', ticketError);
    } else if (existingTickets && existingTickets.length > 0) {
      console.log('❌ User already has ticket');
      return NextResponse.json(
        { error: 'You already have a ticket for this event' },
        { status: 400 }
      );
    }

    console.log('✅ No existing ticket found');

    // Test Stripe before creating session
    console.log('Testing Stripe connection...');
    const testProducts = await stripe.products.list({ limit: 1 });
    console.log('✅ Stripe connection working, products found:', testProducts.data.length);    // Create Stripe checkout session
    console.log('Creating Stripe session...');
    console.log('NEXT_PUBLIC_SITE_URL:', process.env.NEXT_PUBLIC_SITE_URL);    // Clean the base URL to remove any whitespace/newlines
    const rawBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://topcitytickets.org';
    const baseUrl = rawBaseUrl.trim().replace(/[\r\n\t]/g, '');
    
    // Ensure we have a valid URL
    if (!baseUrl.startsWith('http')) {
      throw new Error('Invalid base URL configuration');
    }
    
    console.log('Raw base URL:', JSON.stringify(rawBaseUrl));
    console.log('Cleaned base URL:', baseUrl);
    const successUrl = `${baseUrl}/dashboard?payment=success&event=${eventId}`;
    const cancelUrl = `${baseUrl}/events/${event.slug || eventId}?payment=cancelled`;
    
    console.log('Success URL:', successUrl);
    console.log('Cancel URL:', cancelUrl);
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Ticket for ${event.name}`,
              description: `Event at ${event.venue} on ${event.date}`,
              images: event.image_url ? [event.image_url] : [],
            },
            unit_amount: Math.round(Number(event.ticket_price) * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        eventId: eventId,
        userId: user.id,
        userEmail: user.email || '',
      },
    });

    console.log('✅ Stripe session created:', session.id);

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });

  } catch (error: any) {
    console.error('❌ Stripe checkout error:', error);
    return NextResponse.json(
      { error: `Payment setup failed: ${error.message}` },
      { status: 500 }
    );
  }
}

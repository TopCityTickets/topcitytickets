import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/utils/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-05-28.basil',
});

export async function POST(request: NextRequest) {
  try {
    console.log('=== CREATE CHECKOUT DEBUG ===');
    
    const { eventId, customerEmail, customerName } = await request.json();
    console.log('Event ID:', eventId);
    console.log('Customer Email:', customerEmail);
    console.log('Customer Name:', customerName);

    // Check if user is authenticated (optional for anonymous purchases)
    const authHeader = request.headers.get('authorization');
    console.log('Auth header present:', !!authHeader);
    
    let user = null;
    let isAnonymous = false;
    
    if (authHeader) {
      // User is logged in
      const token = authHeader.replace('Bearer ', '');
      console.log('Token extracted, length:', token.length);
      
      const supabaseClient = supabase();
      const { data: { user: authUser }, error: authError } = await supabaseClient.auth.getUser(token);

      if (authError || !authUser) {
        console.log('❌ Auth error:', authError);
        return NextResponse.json(
          { error: 'Invalid authorization' },
          { status: 401 }
        );
      }
      
      user = authUser;
      console.log('✅ Authenticated user:', user.email);
    } else {
      // Anonymous purchase - require email
      if (!customerEmail) {
        console.log('❌ Anonymous purchase requires email');
        return NextResponse.json(
          { error: 'Email address is required for ticket purchase' },
          { status: 400 }
        );
      }
      
      isAnonymous = true;
      console.log('✅ Anonymous purchase with email:', customerEmail);
    }

    console.log('✅ Authentication status:', isAnonymous ? 'Anonymous' : `User: ${user?.email}`);

    // Create supabase client for database queries
    const supabaseClient = supabase();

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

    console.log('✅ Event found:', event.title, 'Price:', event.ticket_price);

    // Validate ticket price
    if (!event.ticket_price || event.ticket_price <= 0) {
      console.log('❌ Invalid ticket price:', event.ticket_price);
      return NextResponse.json(
        { error: 'Event does not have a valid ticket price' },
        { status: 400 }
      );
    }

    // Check if authenticated user already has a ticket for this event
    // (Anonymous users can buy multiple tickets)
    if (!isAnonymous && user) {
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
    }

    console.log('✅ No existing ticket found');

    // Test Stripe before creating session
    console.log('Testing Stripe connection...');
    const testProducts = await stripe.products.list({ limit: 1 });
    console.log('✅ Stripe connection working, products found:', testProducts.data.length);

    // Create Stripe checkout session
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
              name: `Ticket for ${event.title}`,
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
      customer_email: isAnonymous ? customerEmail : (user?.email || undefined),
      metadata: {
        eventId: eventId,
        userId: isAnonymous ? 'anonymous' : (user?.id || ''),
        userEmail: isAnonymous ? customerEmail : (user?.email || ''),
        customerName: customerName || '',
        isAnonymous: isAnonymous.toString(),
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

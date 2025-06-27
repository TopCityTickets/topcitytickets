import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database-redesign.types';

export const dynamic = 'force-dynamic';

/**
 * Anonymous ticket purchase - no signup required
 * Handles both anonymous and registered user purchases
 */
export async function POST(request: NextRequest) {
  try {
    const { 
      eventId, 
      quantity = 1,
      customerInfo, // { email, firstName?, lastName?, phone? }
      paymentIntentId, // From Stripe
      totalAmount,
      isAnonymous = false,
      userId = null // For registered users
    } = await request.json();

    console.log('Processing ticket purchase:', { eventId, quantity, isAnonymous, userId });

    // Validate input
    if (!eventId || !customerInfo?.email || !paymentIntentId || !totalAmount) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: eventId, customerInfo.email, paymentIntentId, totalAmount'
      }, { status: 400 });
    }

    if (quantity < 1 || quantity > 10) {
      return NextResponse.json({ 
        success: false, 
        error: 'Quantity must be between 1 and 10'
      }, { status: 400 });
    }

    // Create Supabase client with service role
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false }
      }
    );

    // Verify event exists and is active
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .eq('is_active', true)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ 
        success: false, 
        error: 'Event not found or inactive'
      }, { status: 404 });
    }

    // Check if event has available tickets
    if (event.max_tickets && event.tickets_sold + quantity > event.max_tickets) {
      return NextResponse.json({ 
        success: false, 
        error: 'Not enough tickets available'
      }, { status: 400 });
    }

    let purchaseId: string | null = null;
    let anonymousPurchaseId: string | null = null;
    let purchaserUserId: string | null = userId;

    // Handle anonymous purchase
    if (isAnonymous || !userId) {
      const { data: anonPurchase, error: anonError } = await supabase
        .from('anonymous_purchases')
        .insert({
          email: customerInfo.email,
          first_name: customerInfo.firstName || null,
          last_name: customerInfo.lastName || null,
          phone: customerInfo.phone || null
        })
        .select()
        .single();

      if (anonError || !anonPurchase) {
        console.error('Failed to create anonymous purchase:', anonError);
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to process anonymous purchase'
        }, { status: 500 });
      }

      anonymousPurchaseId = anonPurchase.id;
      purchaserUserId = null;
    }

    // Create ticket(s)
    const tickets = [];
    for (let i = 0; i < quantity; i++) {
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .insert({
          event_id: eventId,
          user_id: purchaserUserId,
          anonymous_purchase_id: anonymousPurchaseId,
          purchase_amount: totalAmount / quantity, // Split amount per ticket
          quantity: 1,
          stripe_payment_intent_id: paymentIntentId,
          status: 'valid'
        })
        .select()
        .single();

      if (ticketError || !ticket) {
        console.error('Failed to create ticket:', ticketError);
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to create tickets'
        }, { status: 500 });
      }

      tickets.push(ticket);
    }

    // The escrow system will be automatically updated by triggers

    return NextResponse.json({
      success: true,
      message: 'Tickets purchased successfully',
      tickets: tickets,
      totalAmount: totalAmount,
      quantity: quantity,
      event: {
        id: event.id,
        title: event.title,
        date: event.date,
        time: event.time,
        venue: event.venue
      }
    });

  } catch (err) {
    console.error('Ticket purchase error:', err);
    return NextResponse.json({ 
      success: false, 
      error: err instanceof Error ? err.message : 'Internal server error'
    }, { status: 500 });
  }
}

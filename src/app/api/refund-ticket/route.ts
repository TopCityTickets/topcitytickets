import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/utils/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-05-28.basil',
});

export async function POST(request: NextRequest) {
  try {
    console.log('=== REFUND TICKET DEBUG ===');
    
    const { ticketId, reason } = await request.json();
    console.log('Ticket ID:', ticketId);
    console.log('Refund reason:', reason);

    // Get the current user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      console.log('❌ No authorization header');
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
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

    // Get the ticket and event details
    const { data: ticket, error: ticketError } = await supabaseClient
      .from('tickets')
      .select(`
        *,
        events (
          id,
          name,
          date,
          time,
          user_id
        )
      `)
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      console.log('❌ Ticket error:', ticketError);
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    console.log('✅ Ticket found:', ticket.ticket_code);

    // Check if user has permission to refund
    const { data: userData } = await supabaseClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = userData?.role === 'admin';
    const isEventCreator = ticket.events?.user_id === user.id;

    if (!isAdmin && !isEventCreator) {
      console.log('❌ Permission denied');
      return NextResponse.json(
        { error: 'You do not have permission to refund this ticket' },
        { status: 403 }
      );
    }

    console.log('✅ Permission granted:', isAdmin ? 'Admin' : 'Event Creator');

    // Check if ticket is already refunded
    if (ticket.status === 'refunded') {
      return NextResponse.json(
        { error: 'This ticket has already been refunded' },
        { status: 400 }
      );
    }

    // Check if event has already passed
    const eventDateTime = new Date(`${ticket.events.date}T${ticket.events.time}`);
    const now = new Date();
    
    if (eventDateTime <= now) {
      return NextResponse.json(
        { error: 'Cannot refund tickets after the event has started' },
        { status: 400 }
      );
    }

    console.log('✅ Event is in the future, refund allowed');

    // Process Stripe refund
    if (!ticket.stripe_payment_intent_id) {
      return NextResponse.json(
        { error: 'No payment intent found for this ticket' },
        { status: 400 }
      );
    }

    console.log('Processing Stripe refund...');
    const refund = await stripe.refunds.create({
      payment_intent: ticket.stripe_payment_intent_id,
      reason: 'requested_by_customer',
      metadata: {
        ticketId: ticketId,
        refundedBy: user.id,
        refundReason: reason || 'Admin/Creator refund',
      },
    });

    console.log('✅ Stripe refund created:', refund.id);

    // Update ticket status in database
    const { error: updateError } = await supabaseClient
      .from('tickets')
      .update({
        status: 'refunded',
        updated_at: new Date().toISOString(),
      })
      .eq('id', ticketId);

    if (updateError) {
      console.error('❌ Database update error:', updateError);
      // Note: Stripe refund was successful, but database update failed
      return NextResponse.json(
        { 
          warning: 'Refund processed in Stripe but database update failed',
          refundId: refund.id 
        },
        { status: 200 }
      );
    }

    console.log('✅ Ticket status updated to refunded');

    return NextResponse.json({
      success: true,
      message: 'Ticket refunded successfully',
      refundId: refund.id,
      refundAmount: refund.amount / 100, // Convert from cents
    });

  } catch (error: any) {
    console.error('❌ Refund error:', error);
    return NextResponse.json(
      { error: `Refund failed: ${error.message}` },
      { status: 500 }
    );
  }
}

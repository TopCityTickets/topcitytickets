import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/utils/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-05-28.basil',
});

// This endpoint will be called by a cron job or manually to process escrow releases
export async function POST(request: NextRequest) {
  try {
    console.log('=== PROCESSING ESCROW RELEASES ===');

    // Get tickets ready for release (1 day after purchase)
    const supabaseClient = supabase();
    
    const { data: ticketsToRelease, error: ticketsError } = await supabaseClient
      .from('tickets')
      .select(`
        *,
        events (
          id,
          name,
          created_by,
          stripe_connect_account_id
        ),
        payment_intents!tickets_stripe_payment_intent_id_fkey (
          stripe_payment_intent_id,
          destination_account_id
        )
      `)
      .eq('status', 'valid')
      .is('transfer_id', null)
      .lte('escrow_release_date', new Date().toISOString());

    if (ticketsError) {
      console.error('❌ Error fetching tickets:', ticketsError);
      return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
    }

    console.log(`Found ${ticketsToRelease?.length || 0} tickets ready for release`);

    const results = [];

    for (const ticket of ticketsToRelease || []) {
      try {
        // Calculate transfer amounts
        const grossAmount = ticket.purchase_amount;
        const platformFee = ticket.application_fee || 0;
        const stripeFeePctSo = 0.029; // 2.9% + 30 cents
        const stripeFeeFixed = 0.30;
        const stripeFee = Math.round((grossAmount * stripeFeePctSo + stripeFeeFixed) * 100) / 100;
        const netAmount = grossAmount - platformFee - stripeFee;

        if (netAmount <= 0) {
          console.log(`❌ Invalid transfer amount for ticket ${ticket.id}`);
          continue;
        }

        // Create transfer to seller
        const transfer = await stripe.transfers.create({
          amount: Math.round(netAmount * 100), // Convert to cents
          currency: 'usd',
          destination: ticket.events.stripe_connect_account_id || ticket.payment_intents[0]?.destination_account_id,
          metadata: {
            ticket_id: ticket.id,
            event_id: ticket.event_id,
            seller_id: ticket.events.created_by,
            platform_fee: platformFee.toString(),
          },
        });

        // Record the transfer in database
        const { data: transferRecord, error: transferError } = await supabaseClient
          .from('stripe_transfers')
          .insert({
            ticket_id: ticket.id,
            seller_user_id: ticket.events.created_by,
            stripe_transfer_id: transfer.id,
            gross_amount: grossAmount,
            platform_fee: platformFee,
            stripe_fee: stripeFee,
            net_amount: netAmount,
            status: 'paid',
            transfer_date: new Date().toISOString(),
          })
          .select()
          .single();

        if (transferError) {
          console.error(`❌ Error recording transfer for ticket ${ticket.id}:`, transferError);
          continue;
        }

        // Update ticket with transfer reference
        await supabaseClient
          .from('tickets')
          .update({ transfer_id: transferRecord.id })
          .eq('id', ticket.id);

        console.log(`✅ Transfer completed for ticket ${ticket.id}: $${netAmount}`);
        
        results.push({
          ticket_id: ticket.id,
          transfer_id: transfer.id,
          amount: netAmount,
          status: 'success',
        });

      } catch (error) {
        console.error(`❌ Error processing ticket ${ticket.id}:`, error);
        results.push({
          ticket_id: ticket.id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      processed: results.length,
      results,
    });

  } catch (error) {
    console.error('❌ Escrow processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process escrow releases' },
      { status: 500 }
    );
  }
}

// GET endpoint to check pending releases
export async function GET(request: NextRequest) {
  try {
    const supabaseClient = supabase();
    
    const { data: pendingTickets, error } = await supabaseClient
      .from('tickets')
      .select(`
        id,
        purchase_amount,
        application_fee,
        escrow_release_date,
        events (name)
      `)
      .eq('status', 'valid')
      .is('transfer_id', null)
      .order('escrow_release_date', { ascending: true });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch pending tickets' }, { status: 500 });
    }

    const now = new Date();
    const readyToRelease = pendingTickets?.filter(
      ticket => new Date(ticket.escrow_release_date) <= now
    ) || [];

    const stillInEscrow = pendingTickets?.filter(
      ticket => new Date(ticket.escrow_release_date) > now
    ) || [];

    return NextResponse.json({
      ready_to_release: readyToRelease.length,
      still_in_escrow: stillInEscrow.length,
      pending_tickets: pendingTickets,
    });

  } catch (error) {
    console.error('❌ Error checking escrow status:', error);
    return NextResponse.json(
      { error: 'Failed to check escrow status' },
      { status: 500 }
    );
  }
}

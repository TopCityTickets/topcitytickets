import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';
import { treasuryService } from '@/lib/stripe-treasury';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-05-28.basil',
});

export async function POST(request: NextRequest) {
  try {
    const { eventId, ticketId, paymentIntentId, amount } = await request.json();

    if (!eventId || !ticketId || !paymentIntentId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the current user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseClient = supabase();
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authorization' },
        { status: 401 }
      );
    }

    // Get event and seller information
    const { data: event, error: eventError } = await supabaseClient
      .from('events')
      .select(`
        *,
        creator:users!created_by(
          id,
          email,
          stripe_connect_account_id,
          stripe_financial_account_id,
          stripe_treasury_enabled
        )
      `)
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    const seller = event.creator;
    if (!seller?.stripe_connect_account_id) {
      return NextResponse.json(
        { error: 'Seller has not set up payments' },
        { status: 400 }
      );
    }

    // Calculate platform fee (5% default)
    const platformFeePercentage = parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || '5') / 100;
    const platformFeeAmount = Math.round(amount * platformFeePercentage);
    const sellerAmount = amount - platformFeeAmount;

    try {
      // Create escrow hold record first
      const { data: escrowHold, error: escrowError } = await supabaseClient
        .from('escrow_holds')
        .insert({
          event_id: eventId,
          ticket_id: ticketId,
          buyer_id: user.id,
          seller_id: seller.id,
          payment_intent_id: paymentIntentId,
          total_amount: amount,
          platform_fee: platformFeeAmount,
          seller_amount: sellerAmount,
          status: 'pending',
          financial_account_id: seller.stripe_financial_account_id,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (escrowError) {
        console.error('Error creating escrow hold:', escrowError);
        return NextResponse.json(
          { error: 'Failed to create escrow hold' },
          { status: 500 }
        );
      }

      // If seller has Treasury enabled, create inbound transfer to financial account
      if (seller.stripe_treasury_enabled && seller.stripe_financial_account_id) {
        try {
          // Get the payment method from the PaymentIntent
          const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
          
          if (paymentIntent.payment_method) {
            // Create inbound transfer to move funds to financial account for escrow
            const inboundTransferId = await treasuryService.createInboundTransfer(
              seller.stripe_financial_account_id,
              seller.stripe_connect_account_id,
              sellerAmount, // Only transfer seller amount to escrow, platform fee stays in main account
              paymentIntent.payment_method as string
            );

            // Update escrow hold with transfer ID
            await supabaseClient
              .from('escrow_holds')
              .update({
                inbound_transfer_id: inboundTransferId,
                status: 'held',
                updated_at: new Date().toISOString()
              })
              .eq('id', escrowHold.id);

            console.log(`✅ Escrow hold created with Treasury transfer: ${inboundTransferId}`);

            return NextResponse.json({
              success: true,
              escrowHoldId: escrowHold.id,
              inboundTransferId,
              message: 'Escrow hold created with Treasury integration'
            });
          }
        } catch (treasuryError) {
          console.error('Treasury escrow error:', treasuryError);
          // Fall back to regular escrow without Treasury
        }
      }

      // Regular escrow without Treasury (fallback or for sellers without Treasury)
      await supabaseClient
        .from('escrow_holds')
        .update({
          status: 'held',
          updated_at: new Date().toISOString()
        })
        .eq('id', escrowHold.id);

      console.log(`✅ Regular escrow hold created: ${escrowHold.id}`);

      return NextResponse.json({
        success: true,
        escrowHoldId: escrowHold.id,
        message: 'Escrow hold created (regular mode)'
      });

    } catch (error) {
      console.error('Error creating escrow:', error);
      return NextResponse.json(
        { error: 'Failed to create escrow hold' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Escrow API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

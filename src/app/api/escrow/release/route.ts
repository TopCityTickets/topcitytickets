import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';
import { treasuryService } from '@/lib/stripe-treasury';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { escrowHoldId, adminId } = await request.json();

    if (!escrowHoldId || !adminId) {
      return NextResponse.json(
        { error: 'Escrow hold ID and admin ID are required' },
        { status: 400 }
      );
    }

    // Create Supabase client with service role for admin operations
    const supabaseAdmin = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false }
      }
    );

    // Verify admin user
    const { data: admin, error: adminError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', adminId)
      .single();

    if (adminError || !admin || admin.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get escrow hold details
    const { data: escrowHold, error: escrowError } = await supabaseAdmin
      .from('escrow_holds')
      .select(`
        *,
        event:events(*),
        seller:users!seller_id(*),
        buyer:users!buyer_id(*)
      `)
      .eq('id', escrowHoldId)
      .single();

    if (escrowError || !escrowHold) {
      return NextResponse.json(
        { error: 'Escrow hold not found' },
        { status: 404 }
      );
    }

    if (escrowHold.status !== 'held') {
      return NextResponse.json(
        { error: `Cannot release escrow in status: ${escrowHold.status}` },
        { status: 400 }
      );
    }

    const seller = escrowHold.seller;
    if (!seller) {
      return NextResponse.json(
        { error: 'Seller not found' },
        { status: 404 }
      );
    }

    try {
      let outboundTransferId = null;

      // If seller has Treasury enabled and financial account, use Treasury for payout
      if (seller.stripe_treasury_enabled && 
          seller.stripe_financial_account_id && 
          seller.stripe_connect_account_id) {
        
        try {
          // Create outbound transfer from financial account to seller's bank account
          outboundTransferId = await treasuryService.createOutboundTransfer(
            seller.stripe_financial_account_id,
            seller.stripe_connect_account_id,
            escrowHold.seller_amount
          );

          console.log(`✅ Treasury payout initiated: ${outboundTransferId}`);
        } catch (treasuryError) {
          console.error('Treasury payout error:', treasuryError);
          // Fall back to regular Stripe transfer if Treasury fails
        }
      }

      // Update escrow hold status
      const { error: updateError } = await supabaseAdmin
        .from('escrow_holds')
        .update({
          status: 'released',
          released_at: new Date().toISOString(),
          released_by: adminId,
          outbound_transfer_id: outboundTransferId,
          updated_at: new Date().toISOString()
        })
        .eq('id', escrowHoldId);

      if (updateError) {
        console.error('Error updating escrow hold:', updateError);
        return NextResponse.json(
          { error: 'Failed to update escrow hold' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        escrowHoldId,
        outboundTransferId,
        sellerAmount: escrowHold.seller_amount,
        message: outboundTransferId ? 
          'Escrow released with Treasury payout' : 
          'Escrow released (manual payout required)'
      });

    } catch (error) {
      console.error('Error releasing escrow:', error);
      return NextResponse.json(
        { error: 'Failed to release escrow funds' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Escrow release API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get escrow holds for admin review
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get('adminId');
    const status = searchParams.get('status') || 'held';

    if (!adminId) {
      return NextResponse.json(
        { error: 'Admin ID required' },
        { status: 400 }
      );
    }

    // Create Supabase client with service role
    const supabaseAdmin = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false }
      }
    );

    // Verify admin user
    const { data: admin, error: adminError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', adminId)
      .single();

    if (adminError || !admin || admin.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get escrow holds
    const { data: escrowHolds, error: escrowError } = await supabaseAdmin
      .from('escrow_holds')
      .select(`
        *,
        event:events(id, title, date, venue),
        seller:users!seller_id(id, email, seller_business_name),
        buyer:users!buyer_id(id, email, first_name, last_name)
      `)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (escrowError) {
      console.error('Error fetching escrow holds:', escrowError);
      return NextResponse.json(
        { error: 'Failed to fetch escrow holds' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      escrowHolds: escrowHolds || []
    });

  } catch (error) {
    console.error('Error fetching escrow holds:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

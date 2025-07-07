import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ticketId, adminId } = body;

    if (!ticketId || !adminId) {
      return NextResponse.json(
        { success: false, error: 'Missing ticketId or adminId' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify admin permission
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('role')
      .eq('id', adminId)
      .single();

    if (adminError || adminUser?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    // Get ticket details
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json(
        { success: false, error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Check if ticket is eligible for refund
    if (ticket.status !== 'valid') {
      return NextResponse.json(
        { success: false, error: 'Only valid tickets can be refunded' },
        { status: 400 }
      );
    }

    // Update ticket status to refunded
    const { error: updateError } = await supabase
      .from('tickets')
      .update({ 
        status: 'refunded',
        refunded_at: new Date().toISOString(),
        refunded_by: adminId
      })
      .eq('id', ticketId);

    if (updateError) {
      console.error('Error updating ticket status:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update ticket status' },
        { status: 500 }
      );
    }

    // In a real implementation, you would also:
    // 1. Process the actual refund through your payment processor (Stripe, etc.)
    // 2. Send a refund confirmation email to the customer
    // 3. Update any related records

    return NextResponse.json({
      success: true,
      message: 'Ticket refunded successfully',
      ticketId,
      refundAmount: ticket.purchase_amount
    });

  } catch (error) {
    console.error('Error in refund-ticket API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

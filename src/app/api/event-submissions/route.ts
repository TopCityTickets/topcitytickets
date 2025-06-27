import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database-redesign.types';

export const dynamic = 'force-dynamic';

/**
 * Event submission API
 * Handles sellers submitting events for admin approval
 */

export async function POST(request: NextRequest) {
  try {
    const { 
      sellerId,
      title,
      description,
      date,
      time,
      venue,
      ticketPrice,
      imageUrl,
      organizerEmail
    } = await request.json();

    console.log('Event submission:', { sellerId, title, date, venue });

    // Validate input
    if (!sellerId || !title || !description || !date || !time || !venue || !organizerEmail) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields'
      }, { status: 400 });
    }

    if (ticketPrice < 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Ticket price cannot be negative'
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

    // Verify user is an approved seller
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role, seller_status')
      .eq('id', sellerId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found'
      }, { status: 404 });
    }

    if (user.role !== 'seller' || user.seller_status !== 'approved') {
      return NextResponse.json({ 
        success: false, 
        error: 'User is not an approved seller'
      }, { status: 403 });
    }

    // Create event submission
    const { data: submission, error: submissionError } = await supabase
      .from('event_submissions')
      .insert({
        seller_id: sellerId,
        title,
        description,
        date,
        time,
        venue,
        ticket_price: ticketPrice || 0,
        image_url: imageUrl || null,
        organizer_email: organizerEmail,
        status: 'pending'
      })
      .select()
      .single();

    if (submissionError || !submission) {
      console.error('Failed to create event submission:', submissionError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to submit event'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Event submitted for review',
      submission: {
        id: submission.id,
        title: submission.title,
        status: submission.status,
        submitted_at: submission.submitted_at
      }
    });

  } catch (err) {
    console.error('Event submission error:', err);
    return NextResponse.json({ 
      success: false, 
      error: err instanceof Error ? err.message : 'Internal server error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get('sellerId');
    const status = searchParams.get('status');
    const isAdmin = searchParams.get('isAdmin') === 'true';

    // Create Supabase client with service role
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false }
      }
    );

    let query = supabase
      .from('event_submissions')
      .select(`
        *,
        seller:users!seller_id(id, first_name, last_name, email),
        reviewed_by_user:users!reviewed_by(id, first_name, last_name, email)
      `);

    // Filter by seller if not admin
    if (sellerId && !isAdmin) {
      query = query.eq('seller_id', sellerId);
    }

    // Filter by status if specified
    if (status) {
      query = query.eq('status', status);
    }

    // Order by submission date
    query = query.order('submitted_at', { ascending: false });

    const { data: submissions, error } = await query;

    if (error) {
      console.error('Failed to fetch event submissions:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch submissions'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      submissions: submissions || []
    });

  } catch (err) {
    console.error('Event submissions fetch error:', err);
    return NextResponse.json({ 
      success: false, 
      error: err instanceof Error ? err.message : 'Internal server error'
    }, { status: 500 });
  }
}

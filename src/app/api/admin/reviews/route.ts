import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database-redesign.types';

export const dynamic = 'force-dynamic';

/**
 * Admin review API
 * Handles approval/denial of seller applications and event submissions
 */

// Review seller application
export async function POST(request: NextRequest) {
  try {
    const { 
      type, // 'seller-application' or 'event-submission'
      targetId, // user_id for seller app, submission_id for event
      approved, // boolean
      adminId,
      feedback // optional admin feedback
    } = await request.json();

    console.log('Admin review:', { type, targetId, approved, adminId });

    // Validate input
    if (!type || !targetId || typeof approved !== 'boolean' || !adminId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields'
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

    // Verify admin user
    const { data: admin, error: adminError } = await supabase
      .from('users')
      .select('role')
      .eq('id', adminId)
      .single();

    if (adminError || !admin || admin.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized: Admin access required'
      }, { status: 403 });
    }

    if (type === 'seller-application') {
      // Review seller application
      const { data, error } = await supabase.rpc('review_seller_application', {
        user_id: targetId,
        approved,
        admin_id: adminId
      });

      if (error) {
        console.error('Seller application review error:', error);
        return NextResponse.json({ 
          success: false, 
          error: error.message
        }, { status: 500 });
      }

      return NextResponse.json(data);

    } else if (type === 'event-submission') {
      if (approved) {
        // Approve event submission and create live event
        const { data, error } = await supabase.rpc('approve_event_submission', {
          submission_id: targetId,
          admin_id: adminId
        });

        if (error) {
          console.error('Event approval error:', error);
          return NextResponse.json({ 
            success: false, 
            error: error.message
          }, { status: 500 });
        }

        return NextResponse.json(data);
      } else {
        // Reject event submission
        const { error } = await supabase
          .from('event_submissions')
          .update({
            status: 'rejected',
            admin_feedback: feedback || null,
            reviewed_at: new Date().toISOString(),
            reviewed_by: adminId,
            updated_at: new Date().toISOString()
          })
          .eq('id', targetId)
          .eq('status', 'pending');

        if (error) {
          console.error('Event rejection error:', error);
          return NextResponse.json({ 
            success: false, 
            error: 'Failed to reject event submission'
          }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          message: 'Event submission rejected'
        });
      }
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid review type'
      }, { status: 400 });
    }

  } catch (err) {
    console.error('Admin review error:', err);
    return NextResponse.json({ 
      success: false, 
      error: err instanceof Error ? err.message : 'Internal server error'
    }, { status: 500 });
  }
}

// Get pending reviews
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get('adminId');
    const type = searchParams.get('type'); // 'all', 'seller-applications', 'event-submissions'

    if (!adminId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Admin ID is required'
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

    // Verify admin user
    const { data: admin, error: adminError } = await supabase
      .from('users')
      .select('role')
      .eq('id', adminId)
      .single();

    if (adminError || !admin || admin.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized: Admin access required'
      }, { status: 403 });
    }

    const results: any = {};

    // Get pending seller applications
    if (!type || type === 'all' || type === 'seller-applications') {
      const { data: sellerApps, error: sellerError } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, seller_applied_at')
        .eq('seller_status', 'pending')
        .order('seller_applied_at', { ascending: true });

      if (sellerError) {
        console.error('Failed to fetch seller applications:', sellerError);
      } else {
        results.sellerApplications = sellerApps || [];
      }
    }

    // Get pending event submissions
    if (!type || type === 'all' || type === 'event-submissions') {
      const { data: eventSubs, error: eventError } = await supabase
        .from('event_submissions')
        .select(`
          *,
          seller:users!seller_id(id, first_name, last_name, email)
        `)
        .eq('status', 'pending')
        .order('submitted_at', { ascending: true });

      if (eventError) {
        console.error('Failed to fetch event submissions:', eventError);
      } else {
        results.eventSubmissions = eventSubs || [];
      }
    }

    return NextResponse.json({
      success: true,
      data: results
    });

  } catch (err) {
    console.error('Admin pending reviews fetch error:', err);
    return NextResponse.json({ 
      success: false, 
      error: err instanceof Error ? err.message : 'Internal server error'
    }, { status: 500 });
  }
}

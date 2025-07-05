import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';
import { treasuryService } from '@/lib/stripe-treasury';

export const dynamic = 'force-dynamic';

/**
 * Simplified Admin Review API
 * Handles approval/denial of seller applications and event submissions
 * Uses only the users table for seller applications
 */

// Review seller application or event submission
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
      // Review seller application - update users table directly
      const now = new Date().toISOString();
      const updateData: any = {
        admin_notes: feedback || null,
        updated_at: now
      };

      if (approved) {
        // Approve seller application
        updateData.seller_status = 'approved';
        updateData.role = 'seller';
        updateData.seller_approved_at = now;
        updateData.seller_denied_at = null;
        updateData.can_reapply_at = null;
      } else {
        // Deny seller application
        updateData.seller_status = 'denied';
        updateData.seller_denied_at = now;
        updateData.seller_approved_at = null;
        // Set reapply date to 30 days from now
        const reapplyDate = new Date();
        reapplyDate.setDate(reapplyDate.getDate() + 30);
        updateData.can_reapply_at = reapplyDate.toISOString();
      }

      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', targetId)
        .eq('seller_status', 'pending') // Only update if currently pending
        .select()
        .single();

      if (updateError) {
        console.error('Seller application review error:', updateError);
        return NextResponse.json({ 
          success: false, 
          error: updateError.message
        }, { status: 500 });
      }

      if (!updatedUser) {
        return NextResponse.json({ 
          success: false, 
          error: 'No pending seller application found for this user'
        }, { status: 404 });
      }

      // If seller was approved, attempt to create Treasury financial account
      if (approved && updatedUser.stripe_connect_account_id && !updatedUser.stripe_financial_account_id) {
        try {
          console.log(`Creating Treasury financial account for approved seller: ${targetId}`);
          
          // Check if Treasury capability is available
          const hasTreasuryCapability = await treasuryService.checkTreasuryCapability(updatedUser.stripe_connect_account_id);
          
          if (hasTreasuryCapability) {
            const financialAccountId = await treasuryService.createFinancialAccount(
              updatedUser.stripe_connect_account_id,
              'topcitytickets'
            );

            // Update user with financial account ID
            await supabase
              .from('users')
              .update({
                stripe_financial_account_id: financialAccountId,
                stripe_treasury_enabled: true,
                updated_at: new Date().toISOString()
              })
              .eq('id', targetId);

            console.log(`✅ Treasury financial account created: ${financialAccountId}`);
          } else {
            console.log(`⚠️ Treasury not available for account: ${updatedUser.stripe_connect_account_id}`);
          }
        } catch (treasuryError) {
          console.error('Error creating Treasury financial account:', treasuryError);
          // Don't fail the approval if Treasury creation fails
          // This can be done manually later via the admin panel
        }
      }

      console.log(`✅ Seller application ${approved ? 'approved' : 'denied'} for user ${targetId}`);

      return NextResponse.json({
        success: true,
        message: `Seller application ${approved ? 'approved' : 'denied'} successfully`,
        user: updatedUser
      });

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
        error: 'Admin ID required'
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

    // Get pending seller applications from users table
    if (!type || type === 'all' || type === 'seller-applications') {
      const { data: sellerApps, error: sellerError } = await supabase
        .from('users')
        .select(`
          id, 
          email, 
          first_name, 
          last_name, 
          seller_business_name,
          seller_business_type,
          seller_description,
          seller_contact_email,
          seller_contact_phone,
          website_url,
          seller_applied_at
        `)
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
      const { data: eventSubmissions, error: eventError } = await supabase
        .from('event_submissions')
        .select(`
          *,
          seller:users!seller_id(id, first_name, last_name, email)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (eventError) {
        console.error('Failed to fetch event submissions:', eventError);
      } else {
        results.eventSubmissions = eventSubmissions || [];
      }
    }

    console.log('✅ Pending reviews fetched:', {
      sellerApps: results.sellerApplications?.length || 0,
      eventSubmissions: results.eventSubmissions?.length || 0
    });

    return NextResponse.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('Get pending reviews error:', err);
    return NextResponse.json({ 
      success: false, 
      error: err instanceof Error ? err.message : 'Internal server error'
    }, { status: 500 });
  }
}

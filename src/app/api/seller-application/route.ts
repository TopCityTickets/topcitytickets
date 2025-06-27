import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database-redesign.types';

export const dynamic = 'force-dynamic';

/**
 * Seller application API
 * Handles applying for seller status and checking application status
 */

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID is required'
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

    // Call the apply_for_seller function
    const { data, error } = await supabase.rpc('apply_for_seller', {
      user_id: userId
    });

    if (error) {
      console.error('Seller application error:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message
      }, { status: 500 });
    }

    return NextResponse.json(data);

  } catch (err) {
    console.error('Seller application API error:', err);
    return NextResponse.json({ 
      success: false, 
      error: err instanceof Error ? err.message : 'Internal server error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID is required'
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

    // Get user's seller application status
    const { data: user, error } = await supabase
      .from('users')
      .select('role, seller_status, seller_applied_at, seller_approved_at, seller_denied_at, can_reapply_at')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found'
      }, { status: 404 });
    }

    const now = new Date();
    const canReapplyAt = user.can_reapply_at ? new Date(user.can_reapply_at) : null;
    const canApply = !user.seller_status || 
                    (user.seller_status === 'denied' && (!canReapplyAt || canReapplyAt <= now));

    let daysUntilReapply = null;
    if (user.seller_status === 'denied' && canReapplyAt && canReapplyAt > now) {
      daysUntilReapply = Math.ceil((canReapplyAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }

    return NextResponse.json({
      success: true,
      data: {
        role: user.role,
        seller_status: user.seller_status,
        seller_applied_at: user.seller_applied_at,
        seller_approved_at: user.seller_approved_at,
        seller_denied_at: user.seller_denied_at,
        can_reapply_at: user.can_reapply_at,
        can_apply: canApply,
        days_until_reapply: daysUntilReapply
      }
    });

  } catch (err) {
    console.error('Seller status check error:', err);
    return NextResponse.json({ 
      success: false, 
      error: err instanceof Error ? err.message : 'Internal server error'
    }, { status: 500 });
  }
}

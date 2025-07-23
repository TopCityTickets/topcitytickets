import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has admin role (you might want to implement proper role checking)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const { action } = await request.json();

    switch (action) {
      case 'cleanup_expired_sessions':
        // Clean up expired sessions (example cleanup action)
        const { error: sessionError } = await supabase
          .from('user_sessions')
          .delete()
          .lt('expires_at', new Date().toISOString());

        if (sessionError) {
          throw sessionError;
        }

        return NextResponse.json({
          success: true,
          message: 'Expired sessions cleaned up successfully'
        });

      case 'cleanup_old_logs':
        // Clean up old logs older than 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { error: logsError } = await supabase
          .from('audit_logs')
          .delete()
          .lt('created_at', thirtyDaysAgo.toISOString());

        if (logsError) {
          throw logsError;
        }

        return NextResponse.json({
          success: true,
          message: 'Old logs cleaned up successfully'
        });

      case 'cleanup_cancelled_orders':
        // Clean up cancelled orders older than 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { error: ordersError } = await supabase
          .from('orders')
          .delete()
          .eq('status', 'cancelled')
          .lt('created_at', sevenDaysAgo.toISOString());

        if (ordersError) {
          throw ordersError;
        }

        return NextResponse.json({
          success: true,
          message: 'Cancelled orders cleaned up successfully'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid cleanup action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    availableActions: [
      'cleanup_expired_sessions',
      'cleanup_old_logs',
      'cleanup_cancelled_orders'
    ],
    description: 'Admin cleanup utilities for maintaining database hygiene'
  });
}

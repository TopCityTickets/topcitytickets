import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Debug endpoint to check pending seller applications
export async function GET() {
  try {
    // Create Supabase client with service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false }
      }
    );

    // Get all users with seller_status info
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('id, email, seller_status, seller_business_name, seller_applied_at')
      .order('created_at', { ascending: false })
      .limit(10);

    // Get specifically pending sellers
    const { data: pendingUsers, error: pendingError } = await supabase
      .from('users')
      .select('id, email, seller_status, seller_business_name, seller_applied_at, seller_business_type, seller_contact_email')
      .eq('seller_status', 'pending')
      .order('seller_applied_at', { ascending: true });

    // Get count of pending applications
    const { count: pendingCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('seller_status', 'pending');

    return NextResponse.json({
      success: true,
      debug: {
        allUsersCount: allUsers?.length || 0,
        allUsers: allUsers || [],
        pendingUsersCount: pendingUsers?.length || 0,
        pendingUsers: pendingUsers || [],
        pendingCount: pendingCount || 0,
        timestamp: new Date().toISOString()
      }
    });

  } catch (err) {
    console.error('Debug error:', err);
    return NextResponse.json({ 
      success: false, 
      error: err instanceof Error ? err.message : 'Internal server error'
    }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Reset a user's seller application status
export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email required' 
      }, { status: 400 });
    }

    // Create Supabase client with service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false }
      }
    );

    // Reset user's seller application fields (only the ones that exist)
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({
        seller_status: null,
        seller_business_name: null,
        seller_business_type: null,
        seller_description: null,
        seller_contact_email: null,
        seller_contact_phone: null,
        website_url: null,
        seller_applied_at: null,
        role: 'customer',
        updated_at: new Date().toISOString()
      })
      .eq('email', email)
      .select()
      .single();

    if (error) {
      console.error('Reset error:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }

    // Also clean up any old seller_applications entries if they exist
    try {
      await supabase
        .from('seller_applications')
        .delete()
        .eq('seller_id', updatedUser.id);
    } catch (oldTableError) {
      // Ignore errors if table doesn't exist
      console.log('No old seller_applications table to clean up');
    }

    return NextResponse.json({
      success: true,
      message: `Reset seller application for ${email}`,
      user: updatedUser
    });

  } catch (err) {
    console.error('Reset error:', err);
    return NextResponse.json({ 
      success: false, 
      error: err instanceof Error ? err.message : 'Internal server error'
    }, { status: 500 });
  }
}

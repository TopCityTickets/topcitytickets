import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Create Supabase client with service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false }
      }
    );

    // Reset the user's seller application status
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        seller_status: 'none',
        role: 'customer',
        seller_business_name: null,
        seller_business_type: null,
        seller_description: null,
        seller_contact_email: null,
        seller_contact_phone: null,
        seller_applied_at: null,
        seller_approved_at: null,
        seller_denied_at: null,
        can_reapply_at: null,
        admin_notes: null,
        updated_at: new Date().toISOString()
      })
      .eq('email', email)
      .select()
      .single();

    if (updateError) {
      console.error('Reset error:', updateError);
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Seller application reset for ${email}`,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        seller_status: updatedUser.seller_status,
        role: updatedUser.role
      }
    });

  } catch (err) {
    console.error('Reset seller application error:', err);
    return NextResponse.json({ 
      error: err instanceof Error ? err.message : 'Internal server error'
    }, { status: 500 });
  }
}

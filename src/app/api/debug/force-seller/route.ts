import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Force make a user a seller (for testing)
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

    // Update user to be a seller (only update fields that definitely exist)
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        role: 'seller',
        updated_at: new Date().toISOString()
      })
      .eq('email', email)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating user:', updateError);
      return NextResponse.json({ 
        success: false, 
        error: updateError.message 
      }, { status: 500 });
    }

    if (!updatedUser) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `User ${email} is now a seller!`,
      user: updatedUser
    });

  } catch (err) {
    console.error('Force seller error:', err);
    return NextResponse.json({ 
      success: false, 
      error: err instanceof Error ? err.message : 'Internal server error'
    }, { status: 500 });
  }
}

import { supabase } from '@/utils/supabase';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Get Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No auth token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const supabaseClient = supabase();
    
    // Set the session
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    console.log('Force admin for user:', user.id);    // Update user role to admin using service role (bypasses RLS)
    const { error: updateError } = await supabaseClient
      .from('users')
      .upsert({ 
        id: user.id,
        email: user.email,
        role: 'admin',
        updated_at: new Date().toISOString()
      });

    if (updateError) {
      console.error('Error updating role:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update role',
        details: updateError.message 
      }, { status: 500 });
    }

    // Verify the update
    const { data: userData, error: fetchError } = await supabaseClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    console.log('User role after update:', userData);

    return NextResponse.json({ 
      success: true,
      message: 'Role updated successfully',
      user_id: user.id,
      new_role: userData?.role || 'unknown'
    });

  } catch (error) {
    console.error('Force admin error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

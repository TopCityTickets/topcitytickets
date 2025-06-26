import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic generation for this API route
export const dynamic = 'force-dynamic';

// This is a debug endpoint - should be removed in production
export async function GET(request: NextRequest) {
  try {
    // Use admin client with service role key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const email = searchParams.get('email') || 'topcitytickets@gmail.com';

    if (action === 'check') {
      // Check user role
      const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
      if (authError) throw authError;

      const targetUser = authUsers.users.find(u => u.email === email);
      if (!targetUser) {
        return NextResponse.json({ error: 'User not found in auth.users' }, { status: 404 });
      }

      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', targetUser.id)
        .single();

      return NextResponse.json({
        success: true,
        authUser: {
          id: targetUser.id,
          email: targetUser.email,
          created_at: targetUser.created_at
        },
        publicUser: userData,
        userError: userError?.message || null
      });
    }    if (action === 'set-admin') {
      // Get the user from auth.users first
      const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
      if (authError) {
        return NextResponse.json({ error: 'Failed to list users', details: authError.message }, { status: 500 });
      }

      const targetUser = authUsers.users.find(u => u.email === email);
      if (!targetUser) {
        return NextResponse.json({ error: 'User not found in auth.users' }, { status: 404 });
      }

      // Delete any existing record for this user first
      const { error: deleteError } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', targetUser.id);

      // Don't worry if delete fails (user might not exist)
      
      // Now insert fresh admin record
      const { data: insertedUser, error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          id: targetUser.id,
          email: targetUser.email || email,
          role: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        return NextResponse.json({ 
          error: 'Failed to create admin user', 
          details: insertError.message,
          deleteError: deleteError?.message || 'No existing user to delete'
        }, { status: 500 });
      }      return NextResponse.json({
        success: true,
        message: 'User recreated as admin successfully',
        action: 'recreated',
        user: insertedUser,
        deleteError: deleteError?.message || null
      });
    }

    if (action === 'force-admin') {
      // Nuclear option - find all users with this email and delete them, then recreate as admin
      const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
      if (authError) {
        return NextResponse.json({ error: 'Failed to list users', details: authError.message }, { status: 500 });
      }

      const targetUser = authUsers.users.find(u => u.email === email);
      if (!targetUser) {
        return NextResponse.json({ error: 'User not found in auth.users' }, { status: 404 });
      }

      // Delete all records for this email (in case there are duplicates)
      const { error: deleteByEmailError } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('email', email);

      // Delete by ID as well
      const { error: deleteByIdError } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', targetUser.id);

      // Create fresh admin record
      const { data: newAdmin, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          id: targetUser.id,
          email: email,
          role: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        return NextResponse.json({ 
          error: 'Failed to create admin after cleanup', 
          details: createError.message 
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'User forcefully recreated as admin',
        action: 'force-recreated',
        user: newAdmin,
        cleanupResults: {
          deleteByEmail: deleteByEmailError?.message || 'success',
          deleteById: deleteByIdError?.message || 'success'
        }
      });
    }    return NextResponse.json({ 
      error: 'Invalid action. Use ?action=check, ?action=set-admin, or ?action=force-admin' 
    }, { status: 400 });

  } catch (error: any) {
    console.error('Admin debug error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error?.message || 'Unknown error' 
    }, { status: 500 });
  }
}

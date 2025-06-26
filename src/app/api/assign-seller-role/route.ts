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

    const { user_id, action } = await request.json();

    if (!user_id || !action) {
      return NextResponse.json({ error: 'Missing user_id or action' }, { status: 400 });
    }    // Verify admin permissions - check hardcoded admin first, then RBAC
    const isHardcodedAdmin = user.email === 'topcitytickets@gmail.com';
    
    if (!isHardcodedAdmin) {
      const { data: adminRole } = await supabaseClient
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      if (!adminRole) {
        // Try users table fallback
        const { data: userRole } = await supabaseClient
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (userRole?.role !== 'admin') {
          return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }
      }
    }    if (action === 'approved') {
      console.log(`🎯 Assigning seller role to user: ${user_id}`);
      
      // Update users table (most reliable)
      const { error: usersError } = await supabaseClient
        .from('users')
        .upsert({ 
          id: user_id, 
          role: 'seller',
          updated_at: new Date().toISOString()
        });

      if (usersError) {
        console.error('❌ Error updating users table:', usersError);
      } else {
        console.log('✅ Updated users table successfully');
      }

      // Try to update user_roles table too (if it exists)
      try {
        const { data: existingRole } = await supabaseClient
          .from('user_roles')
          .select('id')
          .eq('user_id', user_id)
          .single();

        if (existingRole) {
          // Update existing role
          const { error: updateError } = await supabaseClient
            .from('user_roles')
            .update({ role: 'seller' })
            .eq('user_id', user_id);

          if (updateError) {
            console.warn('⚠️ Could not update user_roles table:', updateError.message);
          } else {
            console.log('✅ Updated user_roles table successfully');
          }
        } else {
          // Insert new role
          const { error: insertError } = await supabaseClient
            .from('user_roles')
            .insert({ 
              user_id: user_id, 
              role: 'seller' 
            });

          if (insertError) {
            console.warn('⚠️ Could not insert into user_roles table:', insertError.message);
          } else {
            console.log('✅ Inserted into user_roles table successfully');
          }
        }
      } catch (roleError) {
        console.warn('⚠️ user_roles table operation failed (table might not exist):', roleError);
      }
    }

    return NextResponse.json({ 
      success: true,
      message: `User ${action === 'approved' ? 'promoted to seller' : 'role updated'}`,
      user_id: user_id
    });

  } catch (error) {
    console.error('Seller role assignment error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

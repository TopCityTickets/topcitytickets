"use client";

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export const adminActions = {
  // Get all seller applications
  getAllSellerApplications: async () => {
    const supabase = createClientComponentClient();
    
    const { data, error } = await supabase
      .from('seller_applications')
      .select(`
        *,
        profiles:user_id (
          email,
          full_name
        )
      `)
      .order('submitted_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  // Approve seller application
  approveApplication: async (applicationId: string, adminUserId: string) => {
    const supabase = createClientComponentClient();
    
    // Get the application
    const { data: application, error: getError } = await supabase
      .from('seller_applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (getError) {
      throw new Error(getError.message);
    }

    // Update application status
    const { data: updatedApp, error: updateError } = await supabase
      .from('seller_applications')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminUserId,
      })
      .eq('id', applicationId)
      .select()
      .single();

    if (updateError) {
      throw new Error(updateError.message);
    }

    // Get seller role ID
    const { data: sellerRole, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'seller')
      .single();

    if (roleError) {
      throw new Error(roleError.message);
    }

    // Update user role to seller
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .update({ 
        role: 'seller',
        role_id: sellerRole.id
      })
      .eq('id', application.user_id)
      .select()
      .single();

    if (profileError) {
      throw new Error(profileError.message);
    }

    return { application: updatedApp, profile };
  },

  // Reject seller application
  rejectApplication: async (applicationId: string, adminUserId: string, notes?: string) => {
    const supabase = createClientComponentClient();
    
    const { data, error } = await supabase
      .from('seller_applications')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminUserId,
        notes: notes,
      })
      .eq('id', applicationId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  // Get all users
  getAllUsers: async () => {
    const supabase = createClientComponentClient();
    
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        roles (
          name,
          permissions
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  // Update user role
  updateUserRole: async (userId: string, newRole: 'user' | 'seller' | 'admin') => {
    const supabase = createClientComponentClient();
    
    // Get role ID
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', newRole)
      .single();

    if (roleError) {
      throw new Error(roleError.message);
    }

    // Update user profile
    const { data, error } = await supabase
      .from('profiles')
      .update({
        role: newRole,
        role_id: roleData.id
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  // Get platform statistics
  getPlatformStats: async () => {
    const supabase = createClientComponentClient();
    
    const [
      { count: totalUsers },
      { count: totalEvents },
      { count: activeEvents },
      { count: totalSellers },
      { count: pendingApplications }
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('events').select('*', { count: 'exact', head: true }),
      supabase.from('events').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'seller'),
      supabase.from('seller_applications').select('*', { count: 'exact', head: true }).eq('status', 'pending')
    ]);

    return {
      totalUsers: totalUsers || 0,
      totalEvents: totalEvents || 0,
      activeEvents: activeEvents || 0,
      totalSellers: totalSellers || 0,
      pendingApplications: pendingApplications || 0
    };
  },
};

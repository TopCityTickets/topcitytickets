"use client";

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export interface SellerApplication {
  id: string;
  user_id: string;
  business_name: string;
  business_type: string;
  contact_info: {
    email: string;
    phone: string;
    website?: string;
    description?: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  notes?: string;
}

export interface CreateSellerApplicationData {
  business_name: string;
  business_type: string;
  contact_email: string;
  contact_phone: string;
  website_url?: string;
  description?: string;
}

export const sellerActions = {
  // Submit seller application
  submitApplication: async (applicationData: CreateSellerApplicationData, userId: string) => {
    const supabase = createClientComponentClient();
    
    const { data, error } = await supabase
      .from('seller_applications')
      .insert({
        user_id: userId,
        business_name: applicationData.business_name,
        business_type: applicationData.business_type,
        contact_info: {
          email: applicationData.contact_email,
          phone: applicationData.contact_phone,
          website: applicationData.website_url,
          description: applicationData.description,
        },
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data as SellerApplication;
  },

  // Auto-approve seller (for testing/admin use)
  autoApproveSeller: async (applicationData: CreateSellerApplicationData, userId: string) => {
    const supabase = createClientComponentClient();
    
    // First submit the application
    const { data: application, error: appError } = await supabase
      .from('seller_applications')
      .insert({
        user_id: userId,
        business_name: applicationData.business_name,
        business_type: applicationData.business_type,
        contact_info: {
          email: applicationData.contact_email,
          phone: applicationData.contact_phone,
          website: applicationData.website_url,
          description: applicationData.description,
        },
        status: 'approved',
        reviewed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (appError) {
      throw new Error(appError.message);
    }

    // Update user role to seller
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .update({ 
        role: 'seller',
        role_id: (await supabase.from('roles').select('id').eq('name', 'seller').single()).data?.id
      })
      .eq('id', userId)
      .select()
      .single();

    if (profileError) {
      throw new Error(profileError.message);
    }

    return { application, profile };
  },

  // Get user's seller applications
  getUserApplications: async (userId: string) => {
    const supabase = createClientComponentClient();
    
    const { data, error } = await supabase
      .from('seller_applications')
      .select('*')
      .eq('user_id', userId)
      .order('submitted_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data as SellerApplication[];
  },

  // Get all seller applications (admin only)
  getAllApplications: async () => {
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

  // Approve seller application (admin only)
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

    // Update user role to seller
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .update({ 
        role: 'seller',
        role_id: (await supabase.from('roles').select('id').eq('name', 'seller').single()).data?.id
      })
      .eq('id', application.user_id)
      .select()
      .single();

    if (profileError) {
      throw new Error(profileError.message);
    }

    return { application: updatedApp, profile };
  },

  // Reject seller application (admin only)
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

    return data as SellerApplication;
  },
};

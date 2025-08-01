"use client";

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export const authActions = {
  // Sign up new user
  signUp: async (email: string, password: string, fullName: string) => {
    const supabase = createClientComponentClient();
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  // Sign in user
  signIn: async (email: string, password: string) => {
    const supabase = createClientComponentClient();
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  // Sign in with Google
  signInWithGoogle: async () => {
    const supabase = createClientComponentClient();
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  // Sign out user
  signOut: async () => {
    const supabase = createClientComponentClient();
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw new Error(error.message);
    }
  },

  // Update user profile
  updateProfile: async (userId: string, updates: any) => {
    const supabase = createClientComponentClient();
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  // Complete user setup
  completeSetup: async (userId: string) => {
    const supabase = createClientComponentClient();
    
    // First, check if profile exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 is "no rows returned", other errors are actual problems
      throw new Error(`Error checking profile: ${checkError.message}`);
    }

    if (!existingProfile) {
      // Profile doesn't exist, create it first
      const { data: user } = await supabase.auth.getUser();
      
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: user.user?.email,
          full_name: user.user?.user_metadata?.full_name || null,
          setup_completed: true,
          role: 'user'
        })
        .select()
        .single();

      if (createError) {
        throw new Error(`Error creating profile: ${createError.message}`);
      }

      return newProfile;
    } else {
      // Profile exists, just update it
      const { data, error } = await supabase
        .from('profiles')
        .update({ setup_completed: true })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw new Error(`Error updating profile: ${error.message}`);
      }

      return data;
    }
  },

  // Get user profile
  getProfile: async (userId: string) => {
    const supabase = createClientComponentClient();
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },
};

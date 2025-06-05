
'use server';

import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export async function signInWithPassword(data: { email: string; password: string }) {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) {
    return error.message;
  }
  // No explicit redirect here, middleware handles it after session update or client-side navigation will occur.
  return null;
}

export async function signUpWithPassword(data: { email: string; password: string, name?: string }) {
  const origin = headers().get('origin');
  const supabase = createClient();

  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        full_name: data.name, // Store full name in user_metadata
      }
    },
  });

  if (error) {
    return error.message;
  }
  return null;
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/');
}

export async function signInWithGoogle() {
  const supabase = createClient();
  const origin = headers().get('origin');

  if (!origin) {
    return "Could not determine application origin. Please try again.";
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.error('Google Sign-In Error:', error);
    return error.message;
  }

  if (data.url) {
    redirect(data.url); // Redirect to Google's authentication page
  } else {
    return "Could not get Google authentication URL. Please try again.";
  }
  
  return null; // Should not be reached if redirect happens
}

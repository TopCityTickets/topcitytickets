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
  // Or, if you want to force redirect from server action:
  // redirect('/');
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
  // redirect('/'); // Or to a specific page after signup
  return null;
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/');
}

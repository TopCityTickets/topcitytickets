'use server';

// import { createClient } from '@/lib/supabase/server';
// import { headers } from 'next/headers';
// import { redirect } from 'next/navigation';

export async function signInWithPassword(data: { email: string; password: string }) {
  // const supabase = createClient();
  // const { error } = await supabase.auth.signInWithPassword({
  //   email: data.email,
  //   password: data.password,
  // });

  // if (error) {
  //   return error.message;
  // }
  // // No explicit redirect here, middleware handles it after session update or client-side navigation will occur.
  // return null;

  const users = JSON.parse(localStorage.getItem('users') || '{}');
  const user = users[data.email];
  if (!user || user.password !== data.password) {
    return 'Invalid email or password.';
  }
  localStorage.setItem('currentUser', JSON.stringify(user));
  return null;
}

export async function signUpWithPassword(data: { email: string; password: string, name?: string }) {
  // const supabase = createClient();

  // const { error } = await supabase.auth.signUp({
  //   email: data.email,
  //   password: data.password,
  //   options: {
  //     emailRedirectTo: `${origin}/auth/callback`,
  //     data: {
  //       full_name: data.name, // Store full name in user_metadata
  //     }
  //   },
  // });

  // if (error) {
  //   return error.message;
  // }
  // return null;

  let users = JSON.parse(localStorage.getItem('users') || '{}');
  if (users[data.email]) {
    return 'User already exists.';
  }
  const role = data.email === 'topcitytickets@gmail.com' ? 'admin' : 'user';
  const user = { email: data.email, password: data.password, name: data.name, role };
  users[data.email] = user;
  localStorage.setItem('users', JSON.stringify(users));
  localStorage.setItem('currentUser', JSON.stringify(user));
  return null;
}

export async function signOut() {
  // const supabase = createClient();
  // await supabase.auth.signOut();
  // redirect('/');
  localStorage.removeItem('currentUser');
  window.location.href = '/';
}

// Google sign-in is not supported with localStorage
export async function signInWithGoogle() {
  return 'Google sign-in is not supported in localStorage mode.';
}

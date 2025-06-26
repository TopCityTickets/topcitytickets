'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function signIn(prevState: any, formData: FormData) {
  const supabase = createClient();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { message: error.message, error: true };
  }

  // Get user role to redirect to appropriate dashboard
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = userData?.role;
    
    revalidatePath('/', 'layout');
    
    // Redirect based on role
    if (role === 'admin') {
      redirect('/admin/dashboard');
    } else if (role === 'seller') {
      redirect('/seller/dashboard');
    } else {
      redirect('/dashboard');
    }
  }

  revalidatePath('/', 'layout');
  redirect('/');
}

export async function signUp(prevState: any, formData: FormData) {
  const supabase = createClient();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    return { message: error.message, error: true };
  }

  return { message: 'Check your email for the confirmation link!', error: false };
}

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
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  try {
    // Use our custom manual signup API instead of broken Supabase auth.signUp
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/manual-signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      return { message: result.error || 'Signup failed', error: true };
    }

    return { message: 'Account created successfully! You can now sign in with your credentials.', error: false };
  } catch (error) {
    return { message: 'Signup failed. Please try again.', error: true };
  }
}

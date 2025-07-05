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
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;

  console.log('SignUp attempt:', { email, firstName, lastName });

  // Add detailed validation
  if (!email) {
    return { message: 'Email is required', error: true };
  }
  if (!password) {
    return { message: 'Password is required', error: true };
  }
  if (!firstName) {
    return { message: 'First name is required', error: true };
  }
  if (!lastName) {
    return { message: 'Last name is required', error: true };
  }

  if (password.length < 6) {
    return { message: 'Password must be at least 6 characters', error: true };
  }

  try {
    console.log('Creating Supabase client...');
    
    // Check environment variables first
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return { message: 'Missing Supabase URL configuration', error: true };
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return { message: 'Missing Supabase anon key configuration', error: true };
    }

    const supabase = createClient();
    console.log('Supabase client created, attempting signup...');

    // Use Supabase's built-in signup
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        }
      }
    });

    console.log('Signup result:', { data: !!data, error: error?.message });

    if (error) {
      console.error('Signup error:', error);
      return { message: `Signup failed: ${error.message}`, error: true };
    }

    if (data.user) {
      console.log('User created successfully');
      return { 
        message: 'Account created successfully! You can now sign in with your credentials.', 
        error: false 
      };
    }

    return { message: 'Unexpected signup result', error: true };

  } catch (error) {
    console.error('Signup catch error:', error);
    return { 
      message: `Signup failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 
      error: true 
    };
  }
}

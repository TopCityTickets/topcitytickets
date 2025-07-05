import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Emergency fix endpoint to create missing manual_signup function
export async function POST() {
  try {
    // Create Supabase client with service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false }
      }
    );

    // SQL to create the manual_signup function
    const createFunctionSQL = `
-- Drop if exists (in case of conflicts)
DROP FUNCTION IF EXISTS public.manual_signup(text, text, text, text);

-- Create the manual signup function
CREATE FUNCTION public.manual_signup(
    user_email TEXT,
    user_password TEXT,
    user_first_name TEXT,
    user_last_name TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_id UUID;
    result RECORD;
BEGIN
    -- Validation
    IF user_email IS NULL OR user_email = '' THEN
        RETURN json_build_object('success', false, 'error', 'Email is required');
    END IF;
    
    IF user_password IS NULL OR user_password = '' OR LENGTH(user_password) < 6 THEN
        RETURN json_build_object('success', false, 'error', 'Password must be at least 6 characters');
    END IF;
    
    IF user_first_name IS NULL OR user_first_name = '' THEN
        RETURN json_build_object('success', false, 'error', 'First name is required');
    END IF;
    
    IF user_last_name IS NULL OR user_last_name = '' THEN
        RETURN json_build_object('success', false, 'error', 'Last name is required');
    END IF;

    -- Check if user already exists
    SELECT id INTO user_id FROM auth.users WHERE email = user_email LIMIT 1;
    
    -- If user exists, return error
    IF user_id IS NOT NULL THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'An account with this email already exists. Please log in instead.'
        );
    END IF;
    
    -- Create user in auth.users
    user_id := gen_random_uuid();
    
    INSERT INTO auth.users (
        id,
        email,
        encrypted_password,
        raw_user_meta_data,
        created_at,
        updated_at,
        email_confirmed_at
    )
    VALUES (
        user_id,
        user_email,
        crypt(user_password, gen_salt('bf')),
        jsonb_build_object(
            'first_name', user_first_name,
            'last_name', user_last_name
        ),
        now(),
        now(),
        now() -- Auto-confirm email
    )
    RETURNING * INTO result;
    
    -- Create public.users entry
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = user_id) THEN
        INSERT INTO public.users (
            id,
            email,
            role,
            first_name,
            last_name,
            created_at,
            updated_at
        )
        VALUES (
            user_id,
            user_email,
            'customer',
            user_first_name,
            user_last_name,
            now(),
            now()
        );
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Account created successfully',
        'user_id', user_id
    );
    
EXCEPTION
    WHEN unique_violation THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'An account with this email already exists'
        );
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Failed to create account: ' || SQLERRM
        );
END;
$$;`;

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: createFunctionSQL });
    
    if (error) {
      // If exec_sql doesn't exist, try direct query
      const { error: directError } = await supabase.from('__dummy__').select('1').limit(0);
      
      return NextResponse.json({
        success: false,
        error: 'Cannot execute SQL directly. Please run the fix_manual_signup.sql file in Supabase dashboard.',
        suggestion: 'Go to Supabase → SQL Editor → Run fix_manual_signup.sql'
      });
    }

    return NextResponse.json({
      success: true,
      message: 'manual_signup function created successfully',
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('Fix signup error:', err);
    return NextResponse.json({ 
      success: false, 
      error: err instanceof Error ? err.message : 'Internal server error',
      suggestion: 'Please run fix_manual_signup.sql manually in Supabase dashboard'
    }, { status: 500 });
  }
}

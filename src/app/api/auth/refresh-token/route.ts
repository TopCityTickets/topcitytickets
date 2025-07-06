import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import jwt from 'jsonwebtoken';

/**
 * API endpoint to refresh JWT token with role claims
 * This enables role-based access control with custom roles in Supabase
 */
export async function POST(request: NextRequest) {
  try {
    const { role } = await request.json();

    if (!role || !['customer', 'seller', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role provided' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            // Set response cookies will be handled by the response
          },
          remove(name: string, options: any) {
            // Remove response cookies will be handled by the response
          },
        },
      }
    );

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user has the role in database
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (dbError || !userData || userData.role !== role) {
      return NextResponse.json(
        { error: 'Role mismatch or user not found' },
        { status: 403 }
      );
    }

    // Create custom JWT with role claims
    const JWT_SECRET = process.env.SUPABASE_JWT_SECRET;
    if (!JWT_SECRET) {
      console.error('SUPABASE_JWT_SECRET not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Get current session to extract existing claims
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'No active session' },
        { status: 401 }
      );
    }

    // Decode current token to get existing claims
    const currentPayload = jwt.decode(session.access_token) as any;
    
    // Create new token with role claim
    const customPayload = {
      ...currentPayload,
      user_role: role,
      // Add custom role claim for RLS policies
      role: `ticketing_${role}`,
    };

    const customToken = jwt.sign(customPayload, JWT_SECRET, {
      expiresIn: '1h',
    });

    // Return the custom token
    return NextResponse.json({
      access_token: customToken,
      token_type: 'bearer',
      expires_in: 3600,
      user_role: role,
    });

  } catch (error) {
    console.error('Error refreshing token with role:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'Use POST to refresh token with role claims' },
    { status: 405 }
  );
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user profile data
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('profile_picture_url, avatar_url, role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch profile', details: profileError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        profile_picture_url: profile?.profile_picture_url,
        avatar_url: profile?.avatar_url,
        role: profile?.role
      }
    });

  } catch (error: any) {
    console.error('User profile API error:', error);
    return NextResponse.json(
      { error: `Profile fetch failed: ${error.message}` },
      { status: 500 }
    );
  }
}

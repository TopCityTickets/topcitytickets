import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const { phone, token } = await request.json();

  if (!phone || !token) {
    return NextResponse.json({ error: 'Phone number and verification code are required' }, { status: 400 });
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ 
    message: 'Phone verified successfully',
    user: data.user,
    session: data.session 
  });
}

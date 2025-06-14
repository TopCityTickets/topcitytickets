import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { Database } from '@/types/database.types';
import { corsHeaders } from '@/shared/cors';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function OPTIONS() {
  // Handle CORS preflight
  return new NextResponse('ok', { headers: corsHeaders });
}

export async function POST(req: Request) {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY', {
      supabaseUrl,
      supabaseServiceRoleKey,
    });
    return NextResponse.json(
      { error: 'Supabase env vars not set' },
      { status: 500, headers: corsHeaders }
    );
  }

  const supabaseAdmin = createClient<Database>(
    supabaseUrl,
    supabaseServiceRoleKey
  );

  const payload = await req.json();

  try {
    // Handle webhook payload
    return NextResponse.json(
      { message: 'Webhook processed' },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

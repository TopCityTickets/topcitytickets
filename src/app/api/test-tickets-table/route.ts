import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function GET() {
  try {
    const supabaseClient = supabase();
      // Test if tickets table exists by trying to query it
    const { data: tickets, error } = await supabaseClient
      .from('tickets')
      .select('id')
      .limit(1);

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        tableExists: false,
      });
    }

    return NextResponse.json({
      success: true,
      tableExists: true,
      message: 'Tickets table exists and is accessible',
    });

  } catch (error: any) {
    console.error('Tickets table test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      tableExists: false,
    }, { status: 500 });
  }
}

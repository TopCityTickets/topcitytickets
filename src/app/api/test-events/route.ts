import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function GET() {
  try {
    const supabaseClient = supabase();
      // Get all events (no status filter since column might not exist)
    const { data: events, error } = await supabaseClient
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      events: events || [],
      count: events?.length || 0,
    });

  } catch (error: any) {
    console.error('Events test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

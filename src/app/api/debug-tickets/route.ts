import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function GET() {
  try {
    const supabaseClient = supabase();
    
    // Get all tickets for the Church Coin event
    const { data: tickets, error } = await supabaseClient
      .from('tickets')
      .select(`
        *,
        events(name, venue, date)
      `)
      .eq('event_id', 'bbbf6e59-cd48-479f-a9f3-22e9871c65e9')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      tickets: tickets || [],
      count: tickets?.length || 0,
    });

  } catch (error: any) {
    console.error('Tickets debug error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

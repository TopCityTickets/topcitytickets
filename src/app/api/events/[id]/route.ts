import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id;
    const supabaseClient = supabase();

    // Get the current user from the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authorization' },
        { status: 401 }
      );
    }

    // Get the event to check permissions
    const { data: event, error: fetchError } = await supabaseClient
      .from('events')
      .select('user_id')
      .eq('id', eventId)
      .single();

    if (fetchError || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Get user's role
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check permissions: admin OR original seller
    const isAdmin = userData.role === 'admin';
    const isOriginalSeller = event.user_id === user.id;

    if (!isAdmin && !isOriginalSeller) {
      return NextResponse.json(
        { error: 'Permission denied. Only admins or the original event creator can delete this event.' },
        { status: 403 }
      );
    }

    // Delete the event
    const { error: deleteError } = await supabaseClient
      .from('events')
      .delete()
      .eq('id', eventId);

    if (deleteError) {
      console.error('Error deleting event:', deleteError);
      return NextResponse.json(
        { error: `Failed to delete event: ${deleteError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully!'
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id;
    const updateData = await request.json();
    const supabaseClient = supabase();

    // Get the current user from the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authorization' },
        { status: 401 }
      );
    }

    // Get the event to check permissions
    const { data: event, error: fetchError } = await supabaseClient
      .from('events')
      .select('user_id')
      .eq('id', eventId)
      .single();

    if (fetchError || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Get user's role
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check permissions: admin OR original seller
    const isAdmin = userData.role === 'admin';
    const isOriginalSeller = event.user_id === user.id;

    if (!isAdmin && !isOriginalSeller) {
      return NextResponse.json(
        { error: 'Permission denied. Only admins or the original event creator can edit this event.' },
        { status: 403 }
      );
    }

    // Update the event
    const { data: updatedEvent, error: updateError } = await supabaseClient
      .from('events')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', eventId)
      .select('*')
      .single();

    if (updateError) {
      console.error('Error updating event:', updateError);
      return NextResponse.json(
        { error: `Failed to update event: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Event updated successfully!',
      event: updatedEvent
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

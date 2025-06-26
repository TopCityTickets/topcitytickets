import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { action } = await request.json();
    const submissionId = params.id;

    console.log('Processing approval request:', { action, submissionId });

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject".' },
        { status: 400 }
      );
    }

    const supabaseClient = supabase();

    // Get the submission first
    console.log('Fetching submission...');
    const { data: submission, error: fetchError } = await supabaseClient
      .from('event_submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (fetchError) {
      console.error('Error fetching submission:', fetchError);
      return NextResponse.json(
        { error: `Failed to fetch submission: ${fetchError.message}` },
        { status: 404 }
      );
    }

    if (!submission) {
      return NextResponse.json(
        { error: 'Event submission not found' },
        { status: 404 }
      );
    }

    console.log('Found submission:', submission.name);

    if (action === 'approve') {
      // Generate unique slug
      const baseSlug = submission.name
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      
      const slug = `${baseSlug}-${Date.now()}`;
      console.log('Generated slug:', slug);

      // Step 1: Update submission status (simple approach)
      console.log('Updating submission status...');
      const { error: updateError } = await supabaseClient
        .from('event_submissions')
        .update({ status: 'approved' })
        .eq('id', submissionId);

      if (updateError) {
        console.error('Update error:', updateError);
        return NextResponse.json(
          { error: `Update failed: ${updateError.message}` },
          { status: 500 }
        );
      }

      console.log('Submission updated successfully');

      // Step 2: Create public event
      const eventData = {
        name: submission.name,
        description: submission.description || '',
        date: submission.date,
        time: submission.time,
        venue: submission.venue,
        ticket_price: submission.ticket_price,
        image_url: submission.image_url,
        slug: slug,
        user_id: submission.user_id,
        organizer_email: submission.organizer_email,
        is_approved: true
      };

      console.log('Creating public event...');
      const { data: newEvent, error: insertError } = await supabaseClient
        .from('events')
        .insert(eventData)
        .select('id, name')
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        return NextResponse.json(
          { error: `Event creation failed: ${insertError.message}` },
          { status: 500 }
        );
      }

      console.log('Event created:', newEvent);

      return NextResponse.json({
        success: true,
        message: 'Event approved successfully!',
        event: newEvent,
        eventUrl: `/events/${newEvent.id}`
      });

    } else if (action === 'reject') {
      const { error: updateError } = await supabaseClient
        .from('event_submissions')
        .update({ status: 'rejected' })
        .eq('id', submissionId);

      if (updateError) {
        return NextResponse.json(
          { error: `Rejection failed: ${updateError.message}` },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Event submission rejected.'
      });
    }

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
}

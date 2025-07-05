import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { action } = await request.json();
    const submissionId = params.id;

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject".' },
        { status: 400 }
      );
    }

    const supabaseClient = supabase();

    // Get the submission
    const { data: submission, error: fetchError } = await supabaseClient
      .from('event_submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (fetchError || !submission) {
      return NextResponse.json(
        { error: 'Event submission not found' },
        { status: 404 }
      );
    }

    if (action === 'approve') {      // Generate slug
      const slug = submission.title
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      console.log('🔄 Approval process starting:', {
        submissionId,
        eventName: submission.title,
        generatedSlug: slug,
        currentStatus: submission.status
      });      // 1. Update submission status with all required fields
      const updateData = {
        status: 'approved' as const,
        approved_at: new Date().toISOString(),
        admin_feedback: 'Event approved and published',
        slug: slug
      };

      console.log('📝 Updating submission with:', updateData);

      // Use a more explicit update query to avoid trigger issues
      const { data: updateResult, error: updateError } = await supabaseClient
        .from('event_submissions')
        .update(updateData)
        .eq('id', submissionId)
        .select('id, title, status, approved_at, admin_feedback, slug');

      console.log('✅ Update result:', { updateResult, updateError });

      if (updateError) {
        console.error('Error updating submission:', updateError);
        return NextResponse.json(
          { error: `Failed to update submission: ${updateError.message}` },
          { status: 500 }
        );
      }

      // 2. Create public event
      const eventData = {
        title: submission.title,
        description: submission.description,
        date: submission.date,
        time: submission.time,
        venue: submission.venue,
        ticket_price: Number(submission.ticket_price) || 0,
        image_url: submission.image_url || null,
        slug: slug,
        user_id: submission.user_id || null,
        organizer_email: submission.organizer_email,
        is_active: true,
      };

      const { data: newEvent, error: insertError } = await supabaseClient
        .from('events')
        .insert(eventData)
        .select('id, title')
        .single();

      if (insertError) {
        console.error('Error creating event:', insertError);
        return NextResponse.json(
          { error: `Failed to create public event: ${insertError.message}` },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Event approved successfully!',
        event: newEvent,
        eventUrl: `/events/${newEvent.id}`
      });    } else if (action === 'reject') {
      // Update submission status to rejected with admin feedback
      const { error: updateError } = await supabaseClient
        .from('event_submissions')
        .update({ 
          status: 'rejected',
          admin_feedback: 'Event submission rejected'
        })
        .eq('id', submissionId);

      if (updateError) {
        return NextResponse.json(
          { error: `Failed to reject submission: ${updateError.message}` },
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
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

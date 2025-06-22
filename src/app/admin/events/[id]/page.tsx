"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import type { Database } from '@/types/database.types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type EventSubmission = Database['public']['Tables']['event_submissions']['Row'];

export default function AdminEventReview() {
  const params = useParams();
  const eventId = typeof params.id === 'string' ? params.id : params.id?.[0];
  const [event, setEvent] = useState<EventSubmission | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const supabaseClient = supabase();
        const { data, error } = await supabaseClient
          .from('event_submissions')
          .select('*')
          .eq('id', eventId)
          .single();

        if (error) throw error;
        setEvent(data);
      } catch (err) {
        console.error('Error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load event');
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);

  const handleApprove = async () => {
    try {
      if (!event) return;
      
      const supabaseClient = supabase();
      // 1. Update submission status
      const { error: updateError } = await supabaseClient
        .from('event_submissions')
        .update({ status: 'approved' as const })
        .match({ id: event.id });

      if (updateError) throw updateError;

      // 2. Insert into public events table
      const { error: insertError } = await supabaseClient
        .from('events')
        .insert({
          name: event.name,
          description: event.description,
          date: event.date,
          time: event.time,
          venue: event.venue,
          ticket_price: event.ticket_price,
          image_url: event.image_url,
          slug: event.slug,
          user_id: event.user_id,
          organizer_email: event.organizer_email,
          is_approved: true,
        });

      if (insertError) throw insertError;

      const updatedEvent: EventSubmission = {
        ...event,
        status: 'approved'
      };
      
      setEvent(updatedEvent);
    } catch (error) {
      setError('Error approving event');
      console.error(error);
    }
  };

  const handleReject = async () => {
    try {
      if (!event) return;
      
      const supabaseClient = supabase();
      const { error } = await supabaseClient
        .from('event_submissions')
        .update({ status: 'rejected' as const })
        .match({ id: event.id });

      if (error) throw error;

      const updatedEvent: EventSubmission = {
        ...event,
        status: 'rejected'
      };
      
      setEvent(updatedEvent);
    } catch (error) {
      setError('Error rejecting event');
      console.error(error);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Review Event Submission</h1>
      {event && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">{event.name}</h2>
          <p className="mb-4">{event.description}</p>
          <p className="mb-2">{event.date} at {event.time}</p>
          <p className="mb-2">{event.venue}</p>
          <p className="mb-4">${event.ticket_price}</p>
          <div className="flex gap-4">
            <Button onClick={handleApprove}>Approve</Button>
            <Button onClick={handleReject} variant="destructive">Reject</Button>
          </div>
        </Card>
      )}
    </div>
  );
}

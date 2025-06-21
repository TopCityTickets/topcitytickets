"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { EventSubmission, safeCast } from '@/lib/supabase/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';

export default function AdminEventReview() {
  const params = useParams();
  const eventId = typeof params.id === 'string' ? params.id : params.id[0];
  const [event, setEvent] = useState<EventSubmission | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const supabaseClient = supabase();
        const { data, error } = await supabaseClient
          .from('event_submissions')
          .select()
          .match({ id: eventId })
          .single();        if (error) throw error;
        setEvent(safeCast(data, null));
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
      
      const supabaseClient = supabase();      const { error } = await supabaseClient
        .from('event_submissions')
        .update({ status: 'approved' as const })
        .match({ id: event.id });

      if (error) throw error;

      // Create a new object with all required properties
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
      
      const supabaseClient = supabase();      const { error } = await supabaseClient
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
          <p className="mb-2">
            {event.date} at {event.time}
          </p>
          <p className="mb-2">{event.venue}</p>
          <p className="mb-4">${event.ticket_price}</p>
          <div className="flex gap-4">
            <Button onClick={handleApprove}>Approve</Button>
            <Button onClick={handleReject} variant="destructive">Reject</Button>
          </div>
        </Card>
      )}
      {event?.status === 'rejected' && (
        <Alert className="mt-4">
          This event has been rejected. {event.admin_feedback && `Reason: ${event.admin_feedback}`}
        </Alert>
      )}
    </div>
  );
}

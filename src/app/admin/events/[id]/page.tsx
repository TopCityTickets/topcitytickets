"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import type { Database } from '@/types/database.types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';

type EventSubmission = Database['public']['Tables']['event_submissions']['Row'];

export default function AdminEventReview() {
  const [event, setEvent] = useState<EventSubmission | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { id } = useParams();
  const router = useRouter();

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const supabaseClient = supabase();
        const { data, error } = await supabaseClient
          .from('event_submissions')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setEvent(data as EventSubmission);
      } catch (error) {
        setError('Error fetching event data');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  const handleApprove = async () => {
    try {
      if (!event) return;
      
      const supabaseClient = supabase();
      const { error } = await supabaseClient
        .from('event_submissions')
        .update({ status: 'approved' })
        .eq('id', event.id);

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
      
      const supabaseClient = supabase();
      const { error } = await supabaseClient
        .from('event_submissions')
        .update({ status: 'rejected' })
        .eq('id', event.id);

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
    <div>
      <h1>Review Event Submission</h1>
      {event && (
        <Card>
          <h2>{event.name}</h2>
          <p>{event.description}</p>
          <p>
            {event.date} at {event.time}
          </p>
          <p>{event.venue}</p>
          <p>${event.ticket_price}</p>
          <Button onClick={handleApprove}>Approve</Button>
          <Button onClick={handleReject}>Reject</Button>
        </Card>
      )}
      {event?.status === 'rejected' && (
        <Alert>
          This event has been rejected. {event.admin_feedback && `Reason: ${event.admin_feedback}`}
        </Alert>
      )}
    </div>
  );
}

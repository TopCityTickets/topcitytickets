"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { EventStatus } from "@/types/database.types";

// Explicitly define the event submission type
type EventSubmission = {
  id: string;
  name: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  ticket_price: number;
  image_url: string | null;
  slug: string;
  user_id: string;
  organizer_email: string;
  status: EventStatus;
  admin_feedback: string | null;
  created_at: string;
}

export default function AdminDashboard() {
  const [submissions, setSubmissions] = useState<EventSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAdmin } = useAuth();

  useEffect(() => {
    async function fetchSubmissions() {
      try {
        const supabaseClient = supabase();
        const { data, error } = await supabaseClient
          .from('event_submissions')
          .select('*')
          .eq('status', 'pending' as EventStatus)
          .order('created_at', { ascending: false });

        if (error) throw error;
        // Cast the data to the known type to avoid type issues
        setSubmissions((data || []) as EventSubmission[]);
      } catch (err) {
        setError('Failed to load submissions');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (isAdmin) {
      fetchSubmissions();
    }
  }, [isAdmin]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <h2>Pending Event Submissions</h2>
      <ul>
        {submissions.filter(sub => sub.status === 'pending').map((submission) => (
          <li key={submission.id}>
            <p>{submission.name}</p>
            <p>{submission.organizer_email}</p>
            <p>{submission.created_at}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
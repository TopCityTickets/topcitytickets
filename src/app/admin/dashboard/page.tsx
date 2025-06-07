"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/types/database.types";

type EventSubmission = Database['public']['Tables']['event_submissions']['Row'];

export default function AdminDashboard() {
  const [submissions, setSubmissions] = useState<EventSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAdmin } = useAuth();
  const supabaseClient = supabase();

  useEffect(() => {
    async function fetchSubmissions() {
      try {
        const { data, error } = await supabaseClient
          .from('event_submissions')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setSubmissions(data || []);
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
      {submissions.length === 0 ? (
        <p>No pending submissions</p>
      ) : (
        <ul>
          {submissions.map((submission) => (
            <li key={submission.id}>
              <p>{submission.event_name}</p>
              <p>{submission.organizer_name}</p>
              <p>{submission.submission_date}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
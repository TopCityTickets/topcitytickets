"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/types/database.types";

type EventSubmission = Database['public']['Tables']['event_submissions']['Row'];
type EventStatus = 'pending' | 'approved' | 'rejected';

export default function AdminDashboard() {
  const [submissions, setSubmissions] = useState<EventSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAdmin } = useAuth();

  useEffect(() => {
    async function fetchSubmissions() {
      try {
        const supabaseClient = supabase();
        if (!supabaseClient) {
          throw new Error('Failed to initialize Supabase client');
        }

        const { data, error } = await supabaseClient
          .from('event_submissions')
          .select('*')
          .eq('status' as keyof EventSubmission['status'], 'pending' satisfies EventStatus)
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
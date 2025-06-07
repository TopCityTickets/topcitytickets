"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/types/database.types";

type EventSubmission = Database['public']['Tables']['event_submissions']['Row'];

export default function SellerDashboard() {
  const [submissions, setSubmissions] = useState<EventSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isSeller } = useAuth();
  const supabaseClient = supabase();

  useEffect(() => {
    async function fetchMySubmissions() {
      if (!user?.id) return;

      try {
        const { data, error } = await supabaseClient
          .from('event_submissions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setSubmissions(data || []);
      } catch (err) {
        setError('Failed to load your submissions');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (isSeller) {
      fetchMySubmissions();
    }
  }, [user?.id, isSeller]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <h1>Your Event Submissions</h1>
      {submissions.length === 0 ? (
        <p>You have not submitted any events yet.</p>
      ) : (
        <ul>
          {submissions.map((submission) => (
            <li key={submission.id}>
              <h2>{submission.title}</h2>
              <p>{submission.description}</p>
              <p>
                <strong>Status:</strong> {submission.status}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
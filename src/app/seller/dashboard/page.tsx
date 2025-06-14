"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/utils/supabase";
import { Button } from "@/components/ui/button";
import type { Database } from "@/types/database.types";

type EventSubmission = Database['public']['Tables']['event_submissions']['Row'];

export default function SellerDashboard() {
  const [submissions, setSubmissions] = useState<EventSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSubmissions() {
      try {
        const supabaseClient = supabase();
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (!session?.user?.id) return;

        const { data, error } = await supabaseClient
          .from('event_submissions')
          .select('*')
          .eq('user_id', session.user.id);

        if (error) throw error;
        setSubmissions(data || []);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSubmissions();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h1>Your Event Submissions</h1>
      <ul>
        {submissions.map((submission) => (
          <li key={submission.id}>
            <h2>{submission.name}</h2>
            <p>{submission.description}</p>
            <p>Status: {submission.status}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
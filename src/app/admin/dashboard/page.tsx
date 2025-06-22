"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AdminDashboard() {
  const { user, isAdmin, loading } = useAuth();
  const [submissions, setSubmissions] = useState<any[]>([]);

  useEffect(() => {
    if (isAdmin) {
      fetchSubmissions();
    }
  }, [isAdmin]);

  const fetchSubmissions = async () => {
    try {
      const { data } = await supabase()
        .from('event_submissions')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      setSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  if (!user || !isAdmin) {
    return (
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p>Admin access required.</p>
        <Link href="/">
          <Button>Go Home</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <h2 className="text-xl mb-4">Pending Event Submissions ({submissions.length})</h2>
      
      <div className="grid gap-4">
        {submissions.map((submission) => (
          <Card key={submission.id} className="p-4">
            <h3 className="font-semibold">{submission.name}</h3>
            <p className="text-sm text-gray-600">{submission.organizer_email}</p>
            <p className="text-sm">${submission.ticket_price}</p>
            <Link href={`/admin/events/${submission.id}`}>
              <Button size="sm" className="mt-2">Review</Button>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
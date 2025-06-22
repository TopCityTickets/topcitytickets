"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SellerDashboard() {
  const { user, isSeller, loading } = useAuth();
  const [submissions, setSubmissions] = useState<any[]>([]);

  useEffect(() => {
    if (user && isSeller) {
      fetchMySubmissions();
    }
  }, [user, isSeller]);

  const fetchMySubmissions = async () => {
    try {
      const { data } = await supabase()
        .from('event_submissions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      setSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  if (!user || !isSeller) {
    return (
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-4">Seller Access Required</h1>
        <Link href="/dashboard/profile">
          <Button>Request Seller Status</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Seller Dashboard</h1>
      
      <div className="mb-6">
        <Link href="/submit-event">
          <Button>Submit New Event</Button>
        </Link>
      </div>

      <h2 className="text-xl mb-4">Your Event Submissions ({submissions.length})</h2>
      
      <div className="grid gap-4">
        {submissions.map((submission) => (
          <Card key={submission.id} className="p-4">
            <h3 className="font-semibold">{submission.name}</h3>
            <p className="text-sm">Status: <span className="capitalize">{submission.status}</span></p>
            <p className="text-sm">${submission.ticket_price}</p>
            <p className="text-xs text-gray-500">{submission.created_at}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
"use client";
import React, { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

export default function BuyerDashboard() {
  const supabase = createClientComponentClient();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        const userId = data.session.user.id;
        const { data: tks, error } = await supabase
          .from('tickets')
          .select('id,quantity,total_price,status,purchased_at,events(title,date,time)')
          .eq('buyer_id', userId);
        if (!error && tks) setTickets(tks);
      }
      setLoading(false);
    });
  }, [supabase]);

  if (loading) return <p className="p-4 text-white">Loading your tickets...</p>;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      <h1 className="text-3xl font-bold mb-6">Your Tickets</h1>
      {tickets.length > 0 ? (
        <ul className="space-y-4">
          {tickets.map((t) => (
            <li key={t.id} className="p-4 bg-slate-800 rounded-lg">
              <p className="font-semibold">Event: {t.events.title}</p>
              <p>Date: {new Date(t.events.date).toLocaleDateString()} @ {t.events.time}</p>
              <p>Quantity: {t.quantity}</p>
              <p>Total: ${t.total_price}</p>
              <p>Status: {t.status}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>You have not purchased any tickets yet.</p>
      )}
      <div className="mt-6">
        <Link href="/events" className="text-secondary hover:underline">
          Browse Events
        </Link>
      </div>
    </div>
  );
}

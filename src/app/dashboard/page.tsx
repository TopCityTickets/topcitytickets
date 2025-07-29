"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { withAuth } from '@/components/auth/with-auth';
import { Button } from '@/components/ui/button';

function BuyerDashboard() {
  const supabase = createClientComponentClient();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTickets = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: userTickets } = await supabase
        .from('tickets')
        .select('id, quantity, total_price, status, purchased_at, events(title, date, time)')
        .eq('buyer_id', session.user.id);
      if (userTickets) {
        setTickets(userTickets);
      }
      setLoading(false);
    };

    loadTickets();
  }, [supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black to-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-neon-cyan">Loading your tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-slate-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-neon-cyan">Your Tickets</h1>
        
        {tickets && tickets.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tickets.map((t: any) => (
              <div key={t.id} className="p-6 bg-slate-800/50 backdrop-blur-sm rounded-lg border border-neon-cyan/20 hover:border-neon-cyan/50 transition-all">
                <h3 className="text-xl font-semibold text-neon-cyan mb-2">{t.events.title}</h3>
                <div className="space-y-2 text-gray-300">
                  <p>
                    <span className="text-gray-400">Date:</span>{' '}
                    {new Date(t.events.date).toLocaleDateString()} @ {t.events.time}
                  </p>
                  <p>
                    <span className="text-gray-400">Quantity:</span> {t.quantity}
                  </p>
                  <p>
                    <span className="text-gray-400">Total:</span>{' '}
                    <span className="text-neon-pink">${t.total_price}</span>
                  </p>
                  <p>
                    <span className="text-gray-400">Status:</span>{' '}
                    <span className={`${
                      t.status === 'confirmed' ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                      {t.status}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-6">You haven't purchased any tickets yet.</p>
            <Link href="/events">
              <Button className="bg-neon-cyan hover:bg-cyan-600 text-black font-bold">
                Browse Events
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default withAuth(BuyerDashboard);

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';

export default async function BuyerDashboard() {
  const supabase = createServerComponentClient({ cookies });
  // Get current session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    // Redirect to login if not authenticated
    return (
      <div className="min-h-screen bg-slate-900 text-white p-4">
        <h1 className="text-3xl font-bold mb-6">Please log in to view your tickets.</h1>
        <Link href="/login" className="text-secondary hover:underline">Go to Login</Link>
      </div>
    );
  }
  const userId = session.user.id;
  // Fetch tickets with related event info
  const { data: tickets, error } = await supabase
    .from('tickets')
    .select('id, quantity, total_price, status, purchased_at, events(title, date, time)')
    .eq('buyer_id', userId);
  if (error) {
    console.error('Error fetching tickets:', error);
    return <p className="p-4 text-white">Failed to load tickets.</p>;
  }
  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      <h1 className="text-3xl font-bold mb-6">Your Tickets</h1>
      {tickets && tickets.length > 0 ? (
        <ul className="space-y-4">
          {tickets.map((t: any) => (
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

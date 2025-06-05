import Link from 'next/link';
import { Ticket } from 'lucide-react';
import UserNav from './user-nav';
import { createClient } from '@/lib/supabase/server';

export default async function Header() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header className="bg-card shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
          <Ticket className="w-8 h-8" />
          <h1 className="text-2xl font-headline font-bold">Top City Tickets</h1>
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/" className="text-foreground hover:text-primary transition-colors">
            Events
          </Link>
          <UserNav user={user} />
        </nav>
      </div>
    </header>
  );
}

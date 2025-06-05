
import EventList from '@/components/events/event-list';
import { getAllEvents } from '@/lib/events';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PlusCircle } from 'lucide-react';

export default async function HomePage() {
  const events = await getAllEvents();
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userRole = user?.user_metadata?.role;

  return (
    <div className="space-y-12">
      <section className="text-center py-12 bg-card rounded-lg shadow-md">
        <h1 className="text-5xl font-bold font-headline mb-6 text-primary">
          Discover Amazing Events
        </h1>
        <p className="text-xl text-foreground max-w-2xl mx-auto mb-8">
          Your ultimate destination for tickets to the most exciting concerts, festivals, conferences, and more in your city.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90" asChild>
            <Link href="#events">
              Browse Events
            </Link>
          </Button>
          {userRole === 'seller' && (
            <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10" asChild>
              <Link href="/submit-event">
                <PlusCircle className="mr-2 h-5 w-5" />
                Create New Event
              </Link>
            </Button>
          )}
        </div>
      </section>
      
      <section id="events" className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold font-headline">Upcoming Events</h2>
          {/* Redundant if button is in hero, but could be placed here too */}
          {/* {userRole === 'seller' && (
            <Button variant="outline" asChild>
              <Link href="/submit-event">
                <PlusCircle className="mr-2 h-5 w-5" />
                Submit Your Event
              </Link>
            </Button>
          )} */}
        </div>
        <EventList events={events} />
      </section>
    </div>
  );
}

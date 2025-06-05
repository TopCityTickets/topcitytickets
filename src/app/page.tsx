import EventList from '@/components/events/event-list';
import { getAllEvents } from '@/lib/events'; // Updated import
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function HomePage() {
  const events = await getAllEvents();

  return (
    <div className="space-y-12">
      <section className="text-center py-12 bg-card rounded-lg shadow-md">
        <h1 className="text-5xl font-bold font-headline mb-6 text-primary">
          Discover Amazing Events
        </h1>
        <p className="text-xl text-foreground max-w-2xl mx-auto mb-8">
          Your ultimate destination for tickets to the most exciting concerts, festivals, conferences, and more in your city.
        </p>
        <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90" asChild>
          <Link href="#events">
            Browse Events
          </Link>
        </Button>
      </section>
      
      <section id="events" className="space-y-6">
        <h2 className="text-3xl font-bold font-headline text-center">Upcoming Events</h2>
        <EventList events={events} />
      </section>
    </div>
  );
}

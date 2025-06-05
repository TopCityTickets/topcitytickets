import type { Event } from '@/types';
import EventCard from './event-card';

interface EventListProps {
  events: Event[];
}

export default function EventList({ events }: EventListProps) {
  if (!events || events.length === 0) {
    return <p className="text-center text-muted-foreground py-10">No events found.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}

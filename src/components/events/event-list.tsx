
import type { Event } from '@/types';
import EventCard from './event-card';

interface EventListProps {
  events: Event[];
  viewMode?: 'grid' | 'list';
}

export default function EventList({ events, viewMode = 'grid' }: EventListProps) {
  if (!events || events.length === 0) {
    return <p className="text-center text-muted-foreground py-10">No events currently. Please check back later!</p>;
  }

  return (
    <div className={
      viewMode === 'grid' 
        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" 
        : "space-y-4"
    }>
      {events.map((event) => (
        <EventCard key={event.id} event={event} viewMode={viewMode} />
      ))}
    </div>
  );
}

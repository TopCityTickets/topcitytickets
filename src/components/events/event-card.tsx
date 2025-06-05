import type { Event } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { CalendarDays, MapPin, Ticket as TicketIcon } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
  return (
    <Card className="flex flex-col h-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg">
      <CardHeader className="p-0 relative">
        {event.imageUrl && (
          <Link href={`/events/${event.slug}`}>
            <Image
              src={event.imageUrl}
              alt={event.name}
              width={400}
              height={250}
              className="w-full h-48 object-cover"
              data-ai-hint="event concert"
            />
          </Link>
        )}
      </CardHeader>
      <CardContent className="p-6 flex-grow">
        <Link href={`/events/${event.slug}`}>
          <CardTitle className="text-xl font-headline mb-2 hover:text-primary transition-colors">{event.name}</CardTitle>
        </Link>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-primary" />
            <span>{new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} at {event.time}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <span>{event.venue}</span>
          </div>
        </div>
        <CardDescription className="mt-3 text-sm line-clamp-3">
          {event.description}
        </CardDescription>
      </CardContent>
      <CardFooter className="p-6 border-t flex justify-between items-center">
        {event.ticketPrice > 0 ? (
          <Badge variant="secondary" className="text-lg font-semibold">
            ${event.ticketPrice.toFixed(2)}
          </Badge>
        ) : (
          <Badge variant="default" className="text-lg font-semibold bg-green-600 text-white">
            FREE
          </Badge>
        )}
        <Button asChild size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Link href={`/events/${event.slug}`}>
            <TicketIcon className="mr-2 h-4 w-4" />
            View Details
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

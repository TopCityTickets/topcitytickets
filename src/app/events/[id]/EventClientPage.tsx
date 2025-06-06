"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { CalendarDays, MapPin, Ticket as TicketIcon, Users, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SocialShareButtons from '@/components/events/social-share-buttons';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import type { Event } from '@/types';

export default function EventClientPage() {
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);

  useEffect(() => {
    const events = JSON.parse(typeof window !== 'undefined' ? localStorage.getItem('events') || '[]' : '[]');
    const found = events.find((e: Event) => e.slug === params.id);
    if (!found) {
      router.push('/'); // Redirect to home if not found
    } else {
      setEvent(found);
    }
  }, [params.id, router]);

  if (!event) return null;
  const eventUrl = typeof window !== 'undefined' ? window.location.href : `/events/${event.slug}`;

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="overflow-hidden shadow-xl">
        {event.imageUrl && (
          <div className="relative w-full h-72 md:h-96">
            <Image
              src={event.imageUrl}
              alt={event.name}
              fill
              className="object-cover"
              priority
              data-ai-hint="event venue concert"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-6 md:p-8">
              <h1 className="text-4xl md:text-5xl font-bold font-headline text-white shadow-lg">{event.name}</h1>
            </div>
          </div>
        )}
        <CardContent className="p-6 md:p-8 space-y-6">
          {!event.imageUrl && <h1 className="text-3xl md:text-4xl font-bold font-headline mb-4 text-primary">{event.name}</h1>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-lg">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
              <CalendarDays className="w-6 h-6 text-primary" />
              <div>
                <span className="font-semibold">Date:</span> {new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
              <Clock className="w-6 h-6 text-primary" />
              <div>
                <span className="font-semibold">Time:</span> {event.time}
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
              <MapPin className="w-6 h-6 text-primary" />
              <div>
                <span className="font-semibold">Venue:</span> {event.venue}
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
              <Users className="w-6 h-6 text-primary" />
              <div>
                 <span className="font-semibold">Organizer:</span> Contact at <a href={`mailto:${event.organizerEmail}`} className="text-primary hover:underline">{event.organizerEmail}</a>
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-semibold font-headline mb-2">Event Description</h2>
            <p className="text-foreground/80 leading-relaxed whitespace-pre-line">{event.description}</p>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 p-6 bg-card border rounded-lg">
            <div>
              <p className="text-2xl font-bold font-headline">
                {event.ticketPrice > 0 ? `Ticket Price: $${event.ticketPrice.toFixed(2)}` : 'Free Event!'}
              </p>
              {event.ticketPrice > 0 && <p className="text-sm text-muted-foreground">Per person, taxes may apply.</p>}
            </div>
            <Button size="lg" className="w-full md:w-auto bg-accent text-accent-foreground hover:bg-accent/90 shadow-md transition-transform hover:scale-105">
              <TicketIcon className="mr-2 h-5 w-5" />
              {event.ticketPrice > 0 ? 'Buy Tickets' : 'Register Now'}
            </Button>
          </div>
          <SocialShareButtons url={eventUrl} title={event.name} />
          <div className="pt-6 border-t">
            <Button variant="outline" asChild>
                <Link href="/">
                    &larr; Back to All Events
                </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import type { Event } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { CalendarDays, MapPin, Ticket as TicketIcon, ImageIcon, Clock } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

interface EventCardProps {
  event: Event;
  viewMode?: 'grid' | 'list';
}

// Default placeholder image URL
const DEFAULT_EVENT_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='250' viewBox='0 0 400 250'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23E946E7;stop-opacity:0.8' /%3E%3Cstop offset='50%25' style='stop-color:%234F7CFF;stop-opacity:0.6' /%3E%3Cstop offset='100%25' style='stop-color:%23FFD700;stop-opacity:0.4' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='250' fill='%23020204'/%3E%3Crect width='400' height='250' fill='url(%23grad)'/%3E%3Ctext x='200' y='110' text-anchor='middle' fill='white' font-size='16' font-family='Arial, sans-serif'%3EEvent Flyer%3C/text%3E%3Ctext x='200' y='135' text-anchor='middle' fill='white' font-size='12' font-family='Arial, sans-serif' opacity='0.8'%3EComing Soon%3C/text%3E%3Ccircle cx='200' cy='160' r='15' fill='none' stroke='white' stroke-width='2' opacity='0.6'/%3E%3Cpath d='M190 160 h20 M200 150 v20' stroke='white' stroke-width='2' opacity='0.6'/%3E%3C/svg%3E";

export default function EventCard({ event, viewMode = 'grid' }: EventCardProps) {
  const [imageError, setImageError] = useState(false);
  const imageUrl = event.image_url && !imageError ? event.image_url : DEFAULT_EVENT_IMAGE;
    if (viewMode === 'list') {
    return (
      <Card className="flex flex-row overflow-hidden ultra-dark-card list-view-card shadow-lg hover:shadow-2xl transition-all duration-300">
        <div className="w-48 h-32 relative flex-shrink-0">
          <div className="relative w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden">
            <Image
              src={imageUrl}
              alt={event.title}
              fill
              className="object-cover"
              onError={() => setImageError(true)}
              data-ai-hint="event concert"
            />
            {(!event.image_url || imageError) && (
              <div className="absolute inset-0 flex items-center justify-center image-placeholder">
                <div className="text-center text-white/80">
                  <ImageIcon className="h-6 w-6 mx-auto mb-1" />
                  <p className="text-xs">Flyer</p>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 p-6">
          <Link href={`/events/${event.slug || event.id}`}>
            <CardTitle className="text-xl font-headline mb-2 hover:text-primary transition-colors line-clamp-1">
              {event.title}
            </CardTitle>
          </Link>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
            <div className="flex items-center gap-1">
              <CalendarDays className="w-4 h-4 text-primary" />
              <span>{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {event.time}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="line-clamp-1">{event.venue}</span>
            </div>
          </div>
          <CardDescription className="text-sm line-clamp-2 mb-4">
            {event.description}
          </CardDescription>
          <div className="flex justify-between items-center">
            {event.ticket_price > 0 ? (
              <Badge className="price-badge text-lg font-semibold">
                ${event.ticket_price.toFixed(2)}
              </Badge>
            ) : (
              <Badge className="free-badge text-lg font-semibold">
                FREE
              </Badge>
            )}
            <Button asChild size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 dark-button-glow">
              <Link href={`/events/${event.slug || event.id}`}>
                <TicketIcon className="mr-2 h-4 w-4" />
                View Details
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    );
  }  return (
    <Card className="flex flex-col h-full overflow-hidden ultra-dark-card event-card-hover shadow-lg hover:shadow-2xl transition-all duration-300 rounded-lg">
      <CardHeader className="p-0 relative">
        <Link href={`/events/${event.slug || event.id}`}>
          <div className="relative w-full h-48 bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden">
            <Image
              src={imageUrl}
              alt={event.title}
              fill
              className="object-cover hover:scale-105 transition-transform duration-300"
              onError={() => setImageError(true)}
              data-ai-hint="event concert"
            />
            {(!event.image_url || imageError) && (
              <div className="absolute inset-0 flex items-center justify-center image-placeholder">
                <div className="text-center text-white/80">
                  <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm font-medium">Event Flyer</p>
                  <p className="text-xs opacity-75">Coming Soon</p>
                </div>
              </div>
            )}
            {/* Event date badge overlay */}
            <div className="absolute top-4 left-4">
              <Badge className="bg-black/70 text-white border-primary/50">
                {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Badge>
            </div>
          </div>
        </Link>
      </CardHeader>
      <CardContent className="p-6 flex-grow">
        <Link href={`/events/${event.slug || event.id}`}>
          <CardTitle className="text-xl font-headline mb-2 hover:text-primary transition-colors line-clamp-2">
            {event.title}
          </CardTitle>
        </Link>
        <div className="space-y-2 text-sm text-muted-foreground mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary flex-shrink-0" />
            <span>{event.time}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="line-clamp-1">{event.venue}</span>
          </div>
        </div>
        <CardDescription className="text-sm line-clamp-3 mb-4">
          {event.description}
        </CardDescription>
      </CardContent>
      <CardFooter className="p-6 border-t flex justify-between items-center">
        {event.ticket_price > 0 ? (
          <Badge className="price-badge text-lg font-semibold">
            ${event.ticket_price.toFixed(2)}
          </Badge>
        ) : (
          <Badge className="free-badge text-lg font-semibold">
            FREE
          </Badge>
        )}
        <Button asChild size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 dark-button-glow">
          <Link href={`/events/${event.slug || event.id}`}>
            <TicketIcon className="mr-2 h-4 w-4" />
            View Details
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

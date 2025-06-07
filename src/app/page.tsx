"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";
import EventList from '@/components/events/event-list';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';

type ApprovedEvent = {
  id: string;
  title: string;
  name: string; // required by EventList
  imageUrl?: string;
  slug?: string;
  description?: string;
  date: string;
  time: string;
  venue: string;
  organizerEmail?: string;
  ticketPrice?: number;
};

export default function LandingPage() {
  const [events, setEvents] = useState<ApprovedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  // Set your admin UID here (if needed) and admin email for redirecting
  const adminUID = "5d2f1227-7db9-4e4f-a033-f29156e6cd3a";
  const adminEmail = "topcitytickets@gmail.com";

  useEffect(() => {
    async function fetchApprovedEvents() {
      // Querying the new "approved_events" table
      const { data, error } = await supabase
        .from("approved_events")
        .select("*");
      if (!error && data) {
        const mappedData = (data as any[]).map(event => ({
           ...event,
           name: event.title,                    // Map title to name
           date: event.date || "",                // Provide fallback if missing
           time: event.time || "",
           venue: event.venue || "",
           description: event.description || ""   // Ensure description is a string
        }));
        setEvents(mappedData as ApprovedEvent[]);
      }
      setLoading(false);
    }
    fetchApprovedEvents();
  }, []);

  useEffect(() => {
    async function fetchUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      }
    }
    fetchUser();
  }, []);

  // Redirect to admin dashboard if signed in as the admin email
  useEffect(() => {
    if (user && user.email === adminEmail) {
      router.push("/admin-dashboard");
    }
  }, [user, router, adminEmail]);

  if (loading) return <div>Loading events...</div>;

  const hasEvents = events.length > 0;

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
          {user && user.id === adminUID && (
            <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10" asChild>
              <Link href="/submit-event">
                <PlusCircle className="mr-2 h-5 w-5" />
                Create New Event
              </Link>
            </Button>
          )}
          {!user && (
            <>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button size="lg" asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </section>
      
      <section id="events" className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold font-headline">Upcoming Events</h2>
        </div>
        {hasEvents ? (
          <EventList events={events} />
        ) : (
          <div className="text-center py-12">No events available at this time</div>
        )}
      </section>
    </div>
  );
}

"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';
import type { Database } from '@/types/database.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import EventList from "@/components/events/event-list";

type Event = Database['public']['Tables']['events']['Row'];

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    // Check for auth success parameter and force refresh if needed
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('auth_success') === 'true') {
      // Remove the parameter and force a clean state refresh
      const url = new URL(window.location.href);
      url.searchParams.delete('auth_success');
      window.history.replaceState({}, '', url.toString());
      // Small delay to ensure auth state propagates
      setTimeout(() => window.location.reload(), 100);
      return;
    }

    const fetchEvents = async () => {
      const supabaseClient = supabase();
      const { data } = await supabaseClient
        .from('events')
        .select('*')
        .eq('is_approved', true)
        .limit(6);
      if (data) setEvents(data);
      setLoading(false);
    };
    fetchEvents();
  }, []);

  return (
    <div className="min-h-screen">      {/* Hero Section */}
      <section className="dark-hero-bg py-20 px-4 min-h-[80vh] flex items-center">
        <div className="container mx-auto text-center">          <div className="flex justify-center mb-8">
            <Image 
              src="https://vzndqhzpzdphiiblwplh.supabase.co/storage/v1/object/public/pub/logo.png" 
              alt="TopCityTickets Logo" 
              width={120} 
              height={120}
              className="logo-glow pulse-glow"
            />
          </div>
            <h1 className="text-6xl md:text-8xl font-black text-white mb-6 tracking-tight relative">
            TOP<span className="text-accent">CITY</span>
            <br />
            <span className="brand-text-gradient">
              Tickets
            </span>
            <span className="absolute -top-4 -right-4 bg-yellow-500 text-black text-lg font-bold px-3 py-1 rounded-full animate-pulse">
              BETA
            </span>
          </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-2xl mx-auto font-medium">
            🎉 Your premier destination for the hottest events in the city! 
            From concerts to galas, we've got your tickets covered.
          </p>
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-8 max-w-2xl mx-auto">
            <p className="text-green-400 font-semibold mb-2">🚀 Platform Active</p>
            <p className="text-sm text-muted-foreground">
              Marketplace payments with instant seller payouts and professional event management are now live!
            </p>
          </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 dark-button-glow font-bold text-lg px-8 py-4">
              <Link href="/events">🎫 Browse Events</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-primary text-primary hover:bg-primary/10 font-bold text-lg px-8 py-4 dark-text-glow">
              <Link href="/submit-event">📝 Submit Event</Link>
            </Button>
          </div>
        </div>
      </section>      {/* Featured Events Section */}
      <section className="py-16 px-4 bg-background">
        <div className="container mx-auto">
          <h2 className="brand-text-gradient text-4xl font-black text-center mb-12">
            🔥 Featured Events
          </h2>
            {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">              {[...Array(6)].map((_, i) => (                <Card key={i} className="animate-pulse ultra-dark-card">
                  <div className="h-48 bg-muted/30 rounded-t-lg"></div>
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted/30 rounded mb-4"></div>
                    <div className="h-3 bg-muted/30 rounded mb-2"></div>
                    <div className="h-3 bg-muted/30 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : events.length > 0 ? (
            <EventList events={events as any} />
          ) : (            <Card className="max-w-2xl mx-auto text-center p-8 border-dashed border-2 border-primary/30">
              <CardHeader>
                <div className="text-6xl mb-4">🚀</div>
                <CardTitle className="brand-text-gradient text-2xl">Marketplace Ready!</CardTitle>
                <CardDescription className="text-lg">
                  Professional event hosting with instant seller payouts is now live. Start selling your events today!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="brand-gradient text-white font-semibold">
                  <Link href="/signup">Become a Seller</Link>
                </Button>
              </CardContent>
            </Card>
          )}
          
          {events.length > 0 && (
            <div className="text-center mt-12">
              <Button asChild variant="outline" size="lg" className="border-primary text-primary hover:bg-primary/10">
                <Link href="/events">View All Events →</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <h2 className="brand-text-gradient text-4xl font-black text-center mb-12">
            Why Choose TopCityTickets?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center p-8 hover:shadow-lg transition-shadow border-primary/20">
              <div className="text-5xl mb-4">🎪</div>
              <CardTitle className="text-xl mb-4">Premium Events</CardTitle>
              <CardDescription>
                Curated selection of the best concerts, galas, and entertainment in your city.
              </CardDescription>
            </Card>
            
            <Card className="text-center p-8 hover:shadow-lg transition-shadow border-primary/20">
              <div className="text-5xl mb-4">🔒</div>
              <CardTitle className="text-xl mb-4">Secure Booking</CardTitle>
              <CardDescription>
                Safe and secure ticket purchasing with instant confirmation and support.
              </CardDescription>
            </Card>
            
            <Card className="text-center p-8 hover:shadow-lg transition-shadow border-primary/20">
              <div className="text-5xl mb-4">⚡</div>
              <CardTitle className="text-xl mb-4">Instant Access</CardTitle>
              <CardDescription>
                Get your tickets immediately and never miss out on sold-out events.
              </CardDescription>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}

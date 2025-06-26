"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircleIcon, UserIcon, TicketIcon, CalendarIcon, TrendingUpIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function WelcomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    
    // Check if this is a new user (you can implement logic to detect first-time users)
    const authSuccess = new URLSearchParams(window.location.search).get('auth_success');
    if (authSuccess) {
      setIsNewUser(true);
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 w-32 bg-primary/20 rounded mb-4"></div>
          <div className="h-4 w-48 bg-muted/30 rounded"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <CheckCircleIcon className="h-20 w-20 text-green-500 animate-pulse" />
                <div className="absolute inset-0 h-20 w-20 rounded-full bg-green-500/20 animate-ping"></div>
              </div>
            </div>
            <h1 className="text-5xl font-black mb-4 brand-text-gradient">
              🎉 Welcome to TopCityTickets!
            </h1>
            <p className="text-xl text-muted-foreground mb-2">
              Hey {user.email?.split('@')[0]}, you're all set!
            </p>
            <Badge className="bg-green-600 text-white text-lg px-4 py-2">
              Account Successfully Created
            </Badge>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <Card className="ultra-dark-card event-card-hover">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <TicketIcon className="h-8 w-8 text-primary" />
                  <CardTitle className="text-xl">Buy Tickets</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Discover and purchase tickets for amazing events in your city. Secure payments powered by Stripe.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="ultra-dark-card event-card-hover">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <CalendarIcon className="h-8 w-8 text-secondary" />
                  <CardTitle className="text-xl">Submit Events</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Got an event to promote? Submit it for review and get it listed on our platform.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="ultra-dark-card event-card-hover">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <TrendingUpIcon className="h-8 w-8 text-accent" />
                  <CardTitle className="text-xl">Become a Seller</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Ready to sell tickets? Apply to become a verified seller and start earning.
                </CardDescription>
                <Badge className="coming-soon-notice mt-2 text-sm">
                  Coming Soon - Pending Stripe Connect
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
            <Card className="ultra-dark-card">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center space-x-3">
                  <UserIcon className="h-6 w-6 text-primary" />
                  <span>Complete Your Profile</span>
                </CardTitle>
                <CardDescription>
                  Add your details to get the full TopCityTickets experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Email verified</span>
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Profile setup</span>
                  <Badge variant="outline">Optional</Badge>
                </div>
                <Button asChild className="w-full dark-button-glow">
                  <Link href="/dashboard/profile">
                    Complete Profile
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="ultra-dark-card">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center space-x-3">
                  <TicketIcon className="h-6 w-6 text-primary" />
                  <span>Explore Events</span>
                </CardTitle>
                <CardDescription>
                  Start discovering amazing events happening in your area
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Browse through our curated selection of events, from concerts to conferences, and secure your tickets with just a few clicks.
                </p>
                <Button asChild className="w-full dark-button-glow">
                  <Link href="/events">
                    Browse Events
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Beta Notice */}
          <div className="text-center">
            <Card className="ultra-dark-card border-yellow-500/30">
              <CardContent className="pt-6">
                <Badge className="bg-yellow-600 text-white mb-4">
                  🚀 BETA
                </Badge>
                <h3 className="text-lg font-semibold mb-2">You're an Early Adopter!</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  TopCityTickets is currently in beta. Some features like Stripe Connect marketplace are pending approval and will be available soon.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/dashboard">
                      Go to Dashboard
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/">
                      Home Page
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

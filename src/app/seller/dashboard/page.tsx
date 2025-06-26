"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SubmitEventForm from "@/components/events/submit-event-form";
import Link from "next/link";
import { Plus, Calendar, Clock, DollarSign, MapPin, AlertCircle } from "lucide-react";

export default function SellerDashboard() {
  const { user, isSeller, isAdmin, loading } = useAuth();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [approvedEvents, setApprovedEvents] = useState<any[]>([]);

  useEffect(() => {
    if (user && (isSeller || isAdmin)) {
      fetchMySubmissions();
      fetchMyApprovedEvents();
    }
  }, [user, isSeller, isAdmin]);

  const fetchMySubmissions = async () => {
    try {
      const { data } = await supabase()
        .from('event_submissions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      setSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  };

  const fetchMyApprovedEvents = async () => {
    try {
      const { data } = await supabase()
        .from('events')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      setApprovedEvents(data || []);
    } catch (error) {
      console.error('Error fetching approved events:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse max-w-4xl mx-auto">
            <div className="h-8 bg-primary/20 rounded w-64 mb-6"></div>
            <div className="h-32 bg-muted/30 rounded mb-4"></div>
            <div className="h-32 bg-muted/30 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user || (!isSeller && !isAdmin)) {
    return (
      <div className="min-h-screen bg-black">
        <div className="container mx-auto px-4 py-8">
          <Card className="ultra-dark-card p-8 max-w-md mx-auto text-center">
            <AlertCircle className="w-16 h-16 text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4 text-white">Seller Access Required</h1>
            <p className="text-muted-foreground mb-6">
              You need seller status to access this dashboard. Apply for seller status from your user dashboard.
            </p>
            <Button asChild className="dark-button-glow">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 brand-text-gradient">Seller Dashboard</h1>
          <p className="text-muted-foreground">Manage your events and submissions</p>
        </div>        <Tabs defaultValue="payments" className="space-y-6">
          <TabsList className="ultra-dark-card">
            <TabsTrigger value="payments" className="data-[state=active]:bg-primary/20">
              <DollarSign className="w-4 h-4 mr-2" />
              Payment Setup
            </TabsTrigger>
            <TabsTrigger value="submit" className="data-[state=active]:bg-primary/20">
              <Plus className="w-4 h-4 mr-2" />
              Submit Event
            </TabsTrigger>
            <TabsTrigger value="submissions" className="data-[state=active]:bg-primary/20">
              <Clock className="w-4 h-4 mr-2" />
              Pending Submissions ({submissions.filter(s => s.status === 'pending').length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="data-[state=active]:bg-primary/20">
              <Calendar className="w-4 h-4 mr-2" />
              Live Events ({approvedEvents.length})
            </TabsTrigger>
          </TabsList>          {/* Payment Setup Tab */}
          <TabsContent value="payments">
            <Card className="ultra-dark-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Enhanced Payment Setup
                </CardTitle>
                <CardDescription>
                  Connect your Stripe account for instant payouts and enhanced features
                </CardDescription>
              </CardHeader>
              <CardContent>                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6 text-center">
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-xl font-semibold text-green-400 mb-3">Ready to Start Selling!</h3>
                  <p className="text-muted-foreground mb-4">
                    Connect your Stripe account to start receiving payments with:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-2 max-w-md mx-auto mb-6">
                    <li>✨ Instant payouts (24 hours after purchase)</li>
                    <li>💳 Professional payment processing</li>
                    <li>🏪 Your own seller marketplace account</li>
                    <li>📊 Advanced payment analytics</li>
                    <li>🔄 Automatic fee deduction (5% platform fee)</li>
                  </ul>
                  <Button 
                    onClick={() => window.location.href = '/api/stripe-connect/setup'}
                    className="bg-green-500 hover:bg-green-600 text-white font-semibold px-8 py-3"
                  >
                    🔗 Connect Stripe Account
                  </Button>
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mt-4">
                    <p className="text-blue-400 text-sm font-medium">
                      � Secure onboarding powered by Stripe Connect
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Submit Event Tab */}
          <TabsContent value="submit">
            <Card className="ultra-dark-card">
              <CardHeader>
                <CardTitle className="text-white">Submit New Event</CardTitle>
                <CardDescription>
                  Submit your event for admin approval. Once approved, it will be available for ticket sales.
                </CardDescription>
              </CardHeader>              <CardContent>
                <SubmitEventForm />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pending Submissions Tab */}
          <TabsContent value="submissions">
            <div className="space-y-4">
              {submissions.length === 0 ? (
                <Card className="ultra-dark-card p-8 text-center">
                  <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2 text-white">No Submissions Yet</h3>
                  <p className="text-muted-foreground mb-4">Submit your first event to get started!</p>
                </Card>
              ) : (
                submissions.map((submission) => (
                  <Card key={submission.id} className="ultra-dark-card">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-semibold text-white">{submission.name}</h3>
                        <Badge 
                          variant={
                            submission.status === 'approved' ? 'default' : 
                            submission.status === 'rejected' ? 'destructive' : 
                            'secondary'
                          }
                        >
                          {submission.status}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mb-4">{submission.description}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-primary" />
                          <span>{submission.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-primary" />
                          <span>{submission.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-primary" />
                          <span>{submission.venue}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-primary" />
                          <span>${submission.ticket_price}</span>
                        </div>
                      </div>
                      {submission.admin_feedback && (
                        <div className="mt-4 p-3 bg-muted/20 rounded">
                          <p className="text-sm font-medium text-white">Admin Feedback:</p>
                          <p className="text-sm text-muted-foreground">{submission.admin_feedback}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Approved Events Tab */}
          <TabsContent value="approved">
            <div className="space-y-4">
              {approvedEvents.length === 0 ? (
                <Card className="ultra-dark-card p-8 text-center">
                  <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2 text-white">No Live Events</h3>
                  <p className="text-muted-foreground mb-4">Your approved events will appear here.</p>
                </Card>
              ) : (
                approvedEvents.map((event) => (
                  <Card key={event.id} className="ultra-dark-card">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-semibold text-white">{event.name}</h3>
                        <Badge variant="default">Live</Badge>
                      </div>
                      <p className="text-muted-foreground mb-4">{event.description}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-primary" />
                          <span>{event.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-primary" />
                          <span>{event.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-primary" />
                          <span>{event.venue}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-primary" />
                          <span>${event.ticket_price}</span>
                        </div>
                      </div>                      <div className="flex gap-3">
                        <Button asChild className="dark-button-glow">
                          <Link href={`/events/${event.id}`}>View Event Page</Link>
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/events/${event.id}`);
                            alert('Event link copied to clipboard!');
                          }}
                          className="border-primary/30 hover:bg-primary/10"
                        >
                          Copy Share Link
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>        </Tabs>
      </div>
    </div>
  );
}
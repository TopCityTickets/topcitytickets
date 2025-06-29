"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { Users, ShoppingCart, Calendar, CheckCircle, XCircle, Clock, Settings, FileText, RefreshCw } from "lucide-react";

interface SellerApplication {
  id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  applied_at?: string;
  created_at?: string;
  users?: {
    email: string;
  };
}

export default function AdminDashboard() {
  const { user, isAdmin, loading } = useAuth();  const [submissions, setSubmissions] = useState<any[]>([]);
  const [applications, setApplications] = useState<SellerApplication[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [refundingTickets, setRefundingTickets] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSellers: 0,
    pendingApplications: 0,
    totalEvents: 0,
    totalTickets: 0
  });

  useEffect(() => {    if (isAdmin) {
      fetchSubmissions();
      fetchApplications();
      fetchStats();
      fetchTickets();
    }
  }, [isAdmin]);

  const fetchSubmissions = async () => {
    try {
      const { data } = await supabase()
        .from('event_submissions')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      setSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  };
  const fetchApplications = async () => {
    try {
      console.log('Fetching seller applications...');
      
      // Try the nested query first
      const { data: nestedData, error: nestedError } = await supabase()
        .from('seller_applications')
        .select(`
          *,
          users (
            email
          )
        `)
        .order('applied_at', { ascending: false });
      
      if (nestedError) {
        console.warn('Nested query failed, trying manual join:', nestedError);
        
        // Fallback to manual join
        const { data: manualData, error: manualError } = await supabase()
          .from('seller_applications')
          .select('*')
          .order('applied_at', { ascending: false });
        
        if (manualError) {
          console.error('Manual query also failed:', manualError);
          setApplications([]);
          return;
        }
        
        // Get user emails separately
        const applicationsWithEmails = await Promise.all(
          (manualData || []).map(async (app) => {
            const { data: userData } = await supabase()
              .from('users')
              .select('email')
              .eq('id', app.user_id)
              .single();
            
            return {
              ...app,
              users: userData ? { email: userData.email } : { email: 'Unknown' }
            };
          })
        );
        
        console.log('Manual join successful, applications:', applicationsWithEmails);
        setApplications(applicationsWithEmails);
      } else {
        console.log('Nested query successful, applications:', nestedData);
        setApplications(nestedData || []);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      setApplications([]);
    }
  };

  const fetchStats = async () => {
    try {
      const client = supabase();
      
      // Get total users
      const { count: totalUsers } = await client
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Get total sellers
      const { count: totalSellers } = await client
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'seller');

      // Get pending applications
      const { count: pendingApplications } = await client
        .from('seller_applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');      // Get total events
      const { count: totalEvents } = await client
        .from('events')
        .select('*', { count: 'exact', head: true });

      // Get total tickets
      const { count: totalTickets } = await client
        .from('tickets')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalUsers: totalUsers || 0,
        totalSellers: totalSellers || 0,
        pendingApplications: pendingApplications || 0,
        totalEvents: totalEvents || 0,
        totalTickets: totalTickets || 0
      });    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase()
        .from('tickets')
        .select(`
          *,
          events (
            id,
            title,
            date,
            time,
            venue,
            seller_id
          ),
          users (
            id,
            email
          )
        `)
        .order('purchased_at', { ascending: false })
        .limit(50); // Limit to recent 50 tickets for performance

      if (error) {
        console.error('Error fetching tickets:', error);
      } else {
        setTickets(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleRefundTicket = async (ticketId: string) => {
    if (!confirm('Are you sure you want to refund this ticket? This action cannot be undone.')) {
      return;
    }
    
    setRefundingTickets(prev => new Set(prev).add(ticketId));
    
    try {
      const supabaseClient = supabase();
      const { data: { session } } = await supabaseClient.auth.getSession();
      
      if (!session?.access_token) {
        alert('Please log in again to refund tickets.');
        return;
      }

      const response = await fetch('/api/refund-ticket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ ticketId }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('Ticket refunded successfully!');
        // Refresh tickets list and stats
        fetchTickets();
        fetchStats();
      } else {
        console.error('Refund error:', data);
        alert(`Error: ${data.error || 'Failed to refund ticket'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error processing refund. Please try again.');
    } finally {
      setRefundingTickets(prev => {
        const newSet = new Set(prev);
        newSet.delete(ticketId);
        return newSet;
      });
    }
  };

  const canRefundTicket = (ticket: any) => {
    // Only allow refund if ticket is valid (not already refunded or used)
    if (ticket.status !== 'valid') return false;
    
    // Check if event hasn't started yet
    const eventDateTime = new Date(`${ticket.events?.date} ${ticket.events?.time}`);
    const now = new Date();
    return eventDateTime > now;
  };
  const handleApplicationAction = async (applicationId: string, action: 'approved' | 'rejected') => {
    try {
      // First, get the application to find the user_id
      const { data: application, error: fetchError } = await supabase()
        .from('seller_applications')
        .select('user_id')
        .eq('id', applicationId)
        .single();

      if (fetchError) {
        console.error('Error fetching application:', fetchError);
        alert('Error fetching application');
        return;
      }

      // Update the application status
      const { error: updateError } = await supabase()
        .from('seller_applications')
        .update({ 
          status: action,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id
        })
        .eq('id', applicationId);

      if (updateError) {
        console.error('Error updating application:', updateError);
        alert('Error updating application');
        return;
      }

      // If approved, update the user's role to seller
      if (action === 'approved' && application?.user_id) {
        const { error: roleError } = await supabase()
          .from('users')
          .update({ role: 'seller' })
          .eq('id', application.user_id);

        if (roleError) {
          console.error('Error updating user role:', roleError);
          alert('Application approved but failed to update user role');
          return;
        }
      }

      // Refresh applications
      fetchApplications();
      fetchStats();
      
      alert(`Application ${action} successfully!${action === 'approved' ? ' User is now a seller.' : ''}`);
    } catch (error) {
      console.error('Error:', error);
      alert('Error updating application');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="ultra-dark-card">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted/30 rounded mb-2"></div>
                  <div className="h-8 bg-muted/30 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="ultra-dark-card p-6 max-w-md mx-auto">
          <div className="text-center">
            <Settings className="w-16 h-16 text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">Admin Access Required</h1>
            <p className="text-muted-foreground mb-6">You need admin privileges to access this page.</p>
            <Button asChild>
              <Link href="/">Go Home</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-black brand-text-gradient mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage users, sellers, and applications</p>
      </div>      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <Card className="ultra-dark-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
              <Users className="w-8 h-8 text-secondary" />
            </div>
          </CardContent>
        </Card>

        <Card className="ultra-dark-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Sellers</p>
                <p className="text-2xl font-bold">{stats.totalSellers}</p>
              </div>
              <ShoppingCart className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="ultra-dark-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Applications</p>
                <p className="text-2xl font-bold">{stats.pendingApplications}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="ultra-dark-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Events</p>
                <p className="text-2xl font-bold">{stats.totalEvents}</p>
              </div>
              <Calendar className="w-8 h-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card className="ultra-dark-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tickets</p>
                <p className="text-2xl font-bold">{stats.totalTickets}</p>
              </div>
              <FileText className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>      {/* Main Content */}
      <Tabs defaultValue="applications" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="applications">Seller Applications</TabsTrigger>
          <TabsTrigger value="events">Event Submissions</TabsTrigger>
          <TabsTrigger value="tickets">Tickets Management</TabsTrigger>
        </TabsList>

        <TabsContent value="applications" className="space-y-4">
          <Card className="ultra-dark-card">
            <CardHeader>
              <CardTitle>Seller Applications</CardTitle>
              <CardDescription>
                Review and approve seller applications from users
              </CardDescription>
            </CardHeader>            <CardContent>
              {applications.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No seller applications found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((app) => (
                    <Card key={app.id} className="ultra-dark-card">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>                            <p className="font-semibold">{app.users?.email || 'Unknown user'}</p>
                            <p className="text-sm text-muted-foreground">
                              Applied: {app.applied_at 
                                ? new Date(app.applied_at).toLocaleDateString() 
                                : app.created_at 
                                  ? new Date(app.created_at).toLocaleDateString()
                                  : 'Unknown date'
                              }
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={
                                app.status === 'pending' ? 'secondary' :
                                app.status === 'approved' ? 'default' : 'destructive'
                              }
                            >
                              {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                            </Badge>
                            {app.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleApplicationAction(app.id, 'approved')}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleApplicationAction(app.id, 'rejected')}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events">
          <Card className="ultra-dark-card">
            <CardHeader>
              <CardTitle>Event Submissions</CardTitle>
              <CardDescription>
                Review pending event submissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {submissions.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No pending event submissions</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.map((submission) => (
                    <Card key={submission.id} className="ultra-dark-card">
                      <CardContent className="p-4">                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{submission.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Submitted: {new Date(submission.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Button asChild size="sm">
                            <Link href={`/admin/events/${submission.id}`}>
                              Review
                            </Link>
                          </Button>
                        </div>
                      </CardContent>                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>        </TabsContent>

        <TabsContent value="tickets" className="space-y-4">
          <Card className="ultra-dark-card">
            <CardHeader>
              <CardTitle>Tickets Management</CardTitle>
              <CardDescription>
                View and manage all purchased tickets
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tickets.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No tickets found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tickets.map((ticket) => (
                    <Card key={ticket.id} className="ultra-dark-card border-muted/20">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-muted/20 rounded-lg flex items-center justify-center">
                              <FileText className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-white">{ticket.events?.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                {ticket.events?.date} at {ticket.events?.time}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Customer: {ticket.users?.email}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Purchased: {new Date(ticket.purchased_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge 
                              variant={
                                ticket.status === 'valid' ? 'default' :
                                ticket.status === 'used' ? 'secondary' : 
                                ticket.status === 'refunded' ? 'outline' :
                                'destructive'
                              }
                              className="mb-2"
                            >
                              {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                            </Badge>
                            <p className="text-lg font-bold text-primary">
                              ${ticket.purchase_amount}
                            </p>
                            <p className="text-xs text-muted-foreground mb-3">
                              #{ticket.ticket_code.substring(0, 8).toUpperCase()}
                            </p>
                            {canRefundTicket(ticket) && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRefundTicket(ticket.id)}
                                disabled={refundingTickets.has(ticket.id)}
                                className="text-xs"
                              >
                                {refundingTickets.has(ticket.id) ? (
                                  <>
                                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                                    Refunding...
                                  </>
                                ) : (
                                  'Refund'
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { Users, ShoppingCart, Calendar, CheckCircle, XCircle, Clock, Settings } from "lucide-react";

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
  const { user, isAdmin, loading } = useAuth();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [applications, setApplications] = useState<SellerApplication[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSellers: 0,
    pendingApplications: 0,
    totalEvents: 0
  });

  useEffect(() => {
    if (isAdmin) {
      fetchSubmissions();
      fetchApplications();
      fetchStats();
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
        .eq('status', 'pending');

      // Get total events
      const { count: totalEvents } = await client
        .from('events')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalUsers: totalUsers || 0,
        totalSellers: totalSellers || 0,
        pendingApplications: pendingApplications || 0,
        totalEvents: totalEvents || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleApplicationAction = async (applicationId: string, action: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase()
        .from('seller_applications')
        .update({ 
          status: action,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id
        })
        .eq('id', applicationId);

      if (error) {
        console.error('Error updating application:', error);
        alert('Error updating application');
        return;
      }

      // Refresh applications
      fetchApplications();
      fetchStats();
      
      alert(`Application ${action} successfully!`);
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
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
      </div>

      {/* Main Content */}
      <Tabs defaultValue="applications" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="applications">Seller Applications</TabsTrigger>
          <TabsTrigger value="events">Event Submissions</TabsTrigger>
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
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{submission.title}</p>
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
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
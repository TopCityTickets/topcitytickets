"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { Users, ShoppingCart, Calendar, CheckCircle, XCircle, Clock, Settings, FileText, RefreshCw } from "lucide-react";

interface SellerApplication {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  seller_business_name: string;
  seller_business_type: string;
  seller_description?: string | null;
  seller_contact_email: string;
  seller_contact_phone?: string | null;
  website_url?: string | null;
  seller_applied_at: string;
}

export default function AdminDashboard() {
  const { user, isAdmin, loading } = useAuth();
  
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [applications, setApplications] = useState<SellerApplication[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [refundingTickets, setRefundingTickets] = useState<Set<string>>(new Set());
  const [cleanupData, setCleanupData] = useState<any>(null);
  const [debugData, setDebugData] = useState<any>(null);
  const [showCleanup, setShowCleanup] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSellers: 0,
    pendingApplications: 0,
    totalEvents: 0,
    totalTickets: 0
  });

  useEffect(() => {
    if (isAdmin) {
      fetchSubmissions();
      fetchApplications();
      fetchStats();
      fetchTickets();
    }
  }, [isAdmin]);

  const fetchSubmissions = async () => {
    try {
      const { data } = await createClient()
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
      console.log('🔍 [Admin] Fetching seller applications...');
      console.log('🔍 [Admin] Current user:', user?.email);
      
      // Use the new admin reviews API that fetches from users table
      const url = `/api/admin/reviews?adminId=${user?.id}&type=seller-applications`;
      console.log('🔍 [Admin] Fetching from URL:', url);
      
      const response = await fetch(url);
      
      console.log('🔍 [Admin] Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 [Admin] Response error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      console.log('🔍 [Admin] Full API response:', result);
      
      if (!result.success) {
        console.error('🔍 [Admin] API returned error:', result.error);
        setApplications([]);
        return;
      }
      
      console.log('🔍 [Admin] Seller applications data:', result.data);
      console.log('🔍 [Admin] Seller applications array:', result.data.sellerApplications);
      console.log('🔍 [Admin] Number of applications:', result.data.sellerApplications?.length || 0);
      
      setApplications(result.data.sellerApplications || []);
    } catch (error) {
      console.error('🔍 [Admin] Error fetching applications:', error);
      setApplications([]);
    }
  };

  const fetchStats = async () => {
    try {
      const client = createClient();
      
      // Get total users
      const { count: totalUsers } = await client
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Get total sellers
      const { count: totalSellers } = await client
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'seller');

      // Get pending applications from users table
      const { count: pendingApplications } = await client
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('seller_status', 'pending');
        
      // Get total events
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
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchTickets = async () => {
    try {
      const { data, error } = await createClient()
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

  const fetchCleanupData = async () => {
    try {
      const response = await fetch('/api/admin/cleanup');
      const result = await response.json();
      if (result.success) {
        setCleanupData(result.data);
      }
    } catch (error) {
      console.error('Error fetching cleanup data:', error);
    }
  };

  const fetchDebugData = async () => {
    try {
      const response = await fetch('/api/debug/seller-data');
      const result = await response.json();
      if (result.success) {
        setDebugData(result.debug);
        console.log('🔍 DEBUG DATA:', result.debug);
      }
    } catch (error) {
      console.error('Error fetching debug data:', error);
    }
  };

  const fixOldSubmission = async () => {
    if (!confirm('Fix the old seller submission so it appears in the admin dashboard?')) return;
    
    try {
      const response = await fetch('/api/debug/fix-old-submission', {
        method: 'POST'
      });
      const result = await response.json();
      
      if (result.success) {
        alert('✅ Old submission fixed! Refreshing dashboard...');
        fetchApplications(); // Refresh applications
        fetchStats(); // Refresh stats
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Fix error:', error);
      alert('❌ Error fixing submission. Check console.');
    }
  };

  const sqlFix = async () => {
    if (!confirm('Force fix all pending seller data with SQL? This will overwrite any missing fields.')) return;
    
    try {
      const response = await fetch('/api/debug/sql-fix', {
        method: 'POST'
      });
      const result = await response.json();
      
      if (result.success) {
        alert(`✅ SQL fix completed! ${result.message}\nRefreshing dashboard...`);
        fetchApplications(); // Refresh applications
        fetchStats(); // Refresh stats
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error('SQL fix error:', error);
      alert('❌ Error with SQL fix. Check console.');
    }
  };

  const handleCleanupItem = async (id: string, type: 'user' | 'application') => {
    if (!confirm(`Are you sure you want to clean up this ${type} record?`)) return;
    
    try {
      const response = await fetch(`/api/admin/cleanup?id=${id}&type=${type}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      
      if (result.success) {
        alert('Successfully cleaned up the record!');
        fetchCleanupData(); // Refresh cleanup data
        fetchApplications(); // Refresh applications
        fetchStats(); // Refresh stats
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Cleanup error:', error);
      alert('Error during cleanup. Please try again.');
    }
  };

  const handleApplicationAction = async (applicationId: string, action: 'approved' | 'rejected') => {
    try {
      console.log(`🔍 [Admin] Processing ${action} for user ID: ${applicationId}`);
      
      // Use the new admin reviews API to approve/reject seller applications
      const response = await fetch('/api/admin/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'seller-application',
          targetId: applicationId, // This is the user ID from the users table
          approved: action === 'approved',
          adminId: user?.id,
          feedback: action === 'approved' ? 'Application approved by admin' : 'Application rejected by admin'
        }),
      });

      console.log(`🔍 [Admin] Review response status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('🔍 [Admin] Review error:', errorData);
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      console.log('🔍 [Admin] Review result:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to process application');
      }

      // Refresh applications and stats
      fetchApplications();
      fetchStats();
      
      alert(`Application ${action} successfully!${action === 'approved' ? ' User is now a seller.' : ''}`);
    } catch (error) {
      console.error('🔍 [Admin] Error updating application:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to update application'}`);
    }
  };

  const canRefundTicket = (ticket: any) => {
    // Only allow refunds for valid tickets purchased within the last 30 days
    if (ticket.status !== 'valid') return false;
    
    const purchaseDate = new Date(ticket.purchased_at);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysDiff <= 30;
  };

  const handleRefundTicket = async (ticketId: string) => {
    if (!confirm('Are you sure you want to refund this ticket? This action cannot be undone.')) {
      return;
    }

    setRefundingTickets(prev => new Set(prev).add(ticketId));

    try {
      const response = await fetch('/api/admin/refund-ticket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticketId,
          adminId: user?.id,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to refund ticket');
      }

      // Refresh tickets
      fetchTickets();
      
      alert('Ticket refunded successfully!');
    } catch (error) {
      console.error('Error refunding ticket:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to refund ticket'}`);
    } finally {
      setRefundingTickets(prev => {
        const newSet = new Set(prev);
        newSet.delete(ticketId);
        return newSet;
      });
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
                          <div className="flex-1">
                            <p className="font-semibold">{app.seller_business_name}</p>
                            <p className="text-sm text-muted-foreground">{app.seller_contact_email}</p>
                            <p className="text-xs text-muted-foreground">
                              {app.seller_business_type} • Applied: {new Date(app.seller_applied_at).toLocaleDateString()}
                            </p>
                            {app.seller_description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {app.seller_description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              Pending
                            </Badge>
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
          
          {/* Cleanup Section */}
          <Card className="ultra-dark-card">
            <CardHeader>
              <CardTitle>Data Cleanup</CardTitle>
              <CardDescription>
                Identify and clean up orphaned applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Button 
                    onClick={fetchCleanupData} 
                    className="bg-yellow-600 hover:bg-yellow-700"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Check for Orphaned Records
                  </Button>
                  
                  <Button 
                    onClick={fetchDebugData} 
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    🔍 Debug Seller Data
                  </Button>
                  
                  <Button 
                    onClick={fixOldSubmission} 
                    className="bg-green-600 hover:bg-green-700"
                  >
                    🔧 Fix Old Submission
                  </Button>
                  
                  <Button 
                    onClick={sqlFix} 
                    className="bg-red-600 hover:bg-red-700"
                  >
                    💾 SQL Force Fix
                  </Button>
                </div>
                
                {debugData && (
                  <div className="bg-gray-900 p-4 rounded text-sm">
                    <h4 className="font-semibold mb-2">🔍 Debug Information:</h4>
                    <div className="space-y-2">
                      <p>• Pending Users (seller_status = 'pending'): {debugData.counts.pendingUsers}</p>
                      <p>• Records in seller_applications table: {debugData.counts.sellerApplications}</p>
                      <p>• Users with seller data: {debugData.counts.usersWithSellerData}</p>
                      <p>• Users who applied but not pending: {debugData.counts.nonPendingSellerUsers}</p>
                      
                      {debugData.sellerApplications.length > 0 && (
                        <details>
                          <summary className="cursor-pointer font-semibold">📋 Seller Applications Table Records:</summary>
                          <div className="ml-4 mt-2 space-y-2">
                            {debugData.sellerApplications.map((app: any) => (
                              <div key={app.id} className="border-l-2 border-blue-500 pl-2">
                                <p>ID: {app.id}</p>
                                <p>Business: {app.business_name}</p>
                                <p>Email: {app.contact_email}</p>
                                <p>Seller ID: {app.seller_id}</p>
                                <p>Active: {app.is_active ? 'Yes' : 'No'}</p>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                      
                      {debugData.nonPendingSellerUsers.length > 0 && (
                        <details>
                          <summary className="cursor-pointer font-semibold">👤 Users Who Applied But Not Pending:</summary>
                          <div className="ml-4 mt-2 space-y-2">
                            {debugData.nonPendingSellerUsers.map((user: any) => (
                              <div key={user.id} className="border-l-2 border-yellow-500 pl-2">
                                <p>Email: {user.email}</p>
                                <p>Status: {user.seller_status}</p>
                                <p>Business: {user.seller_business_name}</p>
                                <p>Applied: {user.seller_applied_at}</p>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  </div>
                )}
                
                {cleanupData && (
                  <div className="space-y-4 mt-4">
                    <div className="text-sm">
                      <p>Pending Users: {cleanupData.pendingUsersCount}</p>
                      <p>Application Records: {cleanupData.applicationsCount}</p>
                    </div>
                    
                    {cleanupData.applications.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Orphaned Application Records:</h4>
                        {cleanupData.applications.map((app: any) => (
                          <div key={app.id} className="flex items-center justify-between p-2 border rounded">
                            <div>
                              <p className="text-sm">{app.business_name}</p>
                              <p className="text-xs text-muted-foreground">{app.contact_email}</p>
                            </div>
                            <Button 
                              onClick={() => handleCleanupItem(app.id, 'application')}
                              variant="destructive"
                              size="sm"
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {cleanupData.pendingUsers.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Users with Pending Status:</h4>
                        {cleanupData.pendingUsers.map((user: any) => (
                          <div key={user.id} className="flex items-center justify-between p-2 border rounded">
                            <div>
                              <p className="text-sm">{user.email}</p>
                              <p className="text-xs text-muted-foreground">
                                Applied: {user.seller_applied_at ? new Date(user.seller_applied_at).toLocaleDateString() : 'Unknown'}
                              </p>
                            </div>
                            <Button 
                              onClick={() => handleCleanupItem(user.id, 'user')}
                              variant="outline"
                              size="sm"
                            >
                              Reset Status
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
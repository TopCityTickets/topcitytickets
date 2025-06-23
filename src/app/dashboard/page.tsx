"use client";

import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import Link from 'next/link';
import { User, ShoppingCart, Settings, FileText, CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react';

export default function UserDashboard() {
  const { user, role, loading, isAdmin, isSeller } = useAuth();
  const [applying, setApplying] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
  const [applicationDetails, setApplicationDetails] = useState<any>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Check for existing application when component mounts
  useEffect(() => {
    if (user && !isSeller && !isAdmin) {
      checkApplicationStatus();
    }
  }, [user, isSeller, isAdmin]);

  // Function to check if user has a pending application
  const checkApplicationStatus = async () => {
    if (!user) return;
    
    setCheckingStatus(true);
    try {
      const { data, error } = await supabase()
        .from('seller_applications')
        .select('*')
        .eq('user_id', user.id)
        .order('applied_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') { // No rows returned
          console.error('Error checking application status:', error);
        }
        setApplicationStatus('none');
      } else if (data) {
        setApplicationStatus(data.status as any);
        setApplicationDetails(data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="ultra-dark-card">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted/30 rounded mb-4"></div>
                  <div className="h-10 bg-muted/30 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="ultra-dark-card p-6 max-w-md mx-auto">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-muted-foreground mb-6">Please sign in to access your dashboard.</p>
            <Button asChild className="dark-button-glow">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const handleApplyForSeller = async () => {
    setApplying(true);
    try {
      // Get the current session token
      const supabaseClient = supabase();
      const { data: { session } } = await supabaseClient.auth.getSession();
      
      if (!session?.access_token) {
        alert('Please log in again to apply for seller status.');
        return;
      }

      const response = await fetch('/api/apply-seller', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setApplicationStatus('pending');
        alert('Application submitted successfully! An admin will review it shortly.');
      } else {
        console.error('Application error:', data);
        // Show detailed error for debugging
        alert(`Error: ${data.message || data.error}\n\nDetails: ${data.details || 'No additional details'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error submitting application. Please try again.');
    } finally {
      setApplying(false);
    }
  };

  const getRoleIcon = () => {
    switch (role) {
      case 'admin': return <Settings className="w-5 h-5 text-accent" />;
      case 'seller': return <ShoppingCart className="w-5 h-5 text-primary" />;
      default: return <User className="w-5 h-5 text-secondary" />;
    }
  };

  const getRoleBadgeVariant = () => {
    switch (role) {
      case 'admin': return 'default';
      case 'seller': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-4xl font-black brand-text-gradient">
            Welcome back!
          </h1>
          <div className="flex items-center gap-2">
            {getRoleIcon()}
            <Badge variant={getRoleBadgeVariant()} className="text-sm">
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </Badge>
          </div>
        </div>
        <p className="text-muted-foreground text-lg">
          {user.email} • {isAdmin ? 'Admin Dashboard' : isSeller ? 'Seller Dashboard' : 'User Dashboard'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="ultra-dark-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              My Profile
            </CardTitle>
            <CardDescription>
              View and manage your account information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/dashboard/profile">View Profile</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Events Card */}
        <Card className="ultra-dark-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Browse Events
            </CardTitle>
            <CardDescription>
              Discover and purchase event tickets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/events">View Events</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Role-specific Cards */}
        {isAdmin && (
          <Card className="ultra-dark-card border-accent/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-accent">
                <Settings className="w-5 h-5" />
                Admin Panel
              </CardTitle>
              <CardDescription>
                Manage users, events, and applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                <Link href="/admin/dashboard">Admin Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {isSeller && (
          <Card className="ultra-dark-card border-primary/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <ShoppingCart className="w-5 h-5" />
                Submit Events
              </CardTitle>
              <CardDescription>
                Create and manage your events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full dark-button-glow">
                <Link href="/submit-event">Submit Event</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {!isSeller && !isAdmin && (
          <Card className="ultra-dark-card border-secondary/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-secondary">
                <ShoppingCart className="w-5 h-5" />
                Become a Seller
              </CardTitle>
              <CardDescription>
                Apply to become an event seller and start creating events
              </CardDescription>
            </CardHeader>
            <CardContent>
              {checkingStatus ? (
                <div className="text-center p-4">
                  <div className="w-6 h-6 border-2 border-t-transparent border-secondary rounded-full animate-spin mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">Checking status...</p>
                </div>
              ) : applicationStatus === 'pending' ? (
                <div className="text-center p-2">
                  <Clock className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                  <p className="font-medium text-yellow-500">Application Pending</p>
                  <p className="text-xs text-muted-foreground mt-1">Submitted on {applicationDetails?.applied_at ? new Date(applicationDetails.applied_at).toLocaleDateString() : 'recently'}</p>
                  <p className="text-sm text-muted-foreground mt-2">An admin will review your application soon</p>
                </div>
              ) : applicationStatus === 'approved' ? (
                <div className="text-center p-2">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="font-medium text-green-500">Application Approved!</p>
                  <p className="text-sm text-muted-foreground mt-2">Please refresh the page to access seller features</p>
                </div>
              ) : applicationStatus === 'rejected' ? (
                <div className="text-center p-2">
                  <XCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
                  <p className="font-medium text-destructive">Application Rejected</p>
                  <p className="text-sm text-muted-foreground mt-2">Contact support for more information</p>
                </div>
              ) : (
                <Button 
                  onClick={handleApplyForSeller}
                  disabled={applying}
                  className="w-full"
                  variant="outline"
                >
                  {applying ? 'Applying...' : 'Apply to Become a Seller'}
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
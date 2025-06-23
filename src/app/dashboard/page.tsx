"use client";

import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { supabase } from '@/utils/supabase';
import Link from 'next/link';
import { User, ShoppingCart, Settings, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default function UserDashboard() {
  const { user, role, loading, isAdmin, isSeller } = useAuth();
  const [applying, setApplying] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');

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
      const supabaseClient = supabase();
      
      // Insert seller application
      const { error } = await supabaseClient
        .from('seller_applications')
        .insert([
          {
            user_id: user.id,
            status: 'pending',
            applied_at: new Date().toISOString()
          }
        ]);

      if (error) {
        console.error('Application error:', error);
        alert('Error submitting application. Please try again.');
      } else {
        setApplicationStatus('pending');
        alert('Application submitted successfully! We\'ll review it shortly.');
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
              {applicationStatus === 'pending' ? (
                <div className="text-center">
                  <Clock className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Application pending review</p>
                </div>
              ) : applicationStatus === 'approved' ? (
                <div className="text-center">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Application approved!</p>
                </div>
              ) : (
                <Button 
                  onClick={handleApplyForSeller}
                  disabled={applying}
                  className="w-full"
                  variant="outline"
                >
                  {applying ? 'Submitting...' : 'Apply for Seller Status'}
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
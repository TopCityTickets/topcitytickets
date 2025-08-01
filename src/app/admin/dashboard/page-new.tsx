"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { adminActions } from '@/lib/actions/admin';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function AdminDashboardPage() {
  const { user, isAuthenticated, role } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && user && role === 'admin') {
      loadDashboardData();
    }
  }, [isAuthenticated, user, role]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [statsData, applicationsData] = await Promise.all([
        adminActions.getPlatformStats(),
        adminActions.getAllSellerApplications()
      ]);
      
      setStats(statsData);
      setApplications(applicationsData);
    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveApplication = async (applicationId: string) => {
    if (!user) return;
    
    try {
      await adminActions.approveApplication(applicationId, user.id);
      alert('Application approved successfully!');
      loadDashboardData(); // Refresh data
    } catch (err: any) {
      console.error('Error approving application:', err);
      alert(err.message || 'Failed to approve application');
    }
  };

  const handleRejectApplication = async (applicationId: string) => {
    if (!user) return;
    
    const notes = prompt('Rejection reason (optional):');
    
    try {
      await adminActions.rejectApplication(applicationId, user.id, notes || undefined);
      alert('Application rejected.');
      loadDashboardData(); // Refresh data
    } catch (err: any) {
      console.error('Error rejecting application:', err);
      alert(err.message || 'Failed to reject application');
    }
  };

  if (!isAuthenticated || role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center bg-slate-800 border-slate-700">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-slate-300 mb-6">You must be an admin to access this dashboard.</p>
          <Button
            onClick={() => router.push('/')}
            className="w-full bg-primary hover:bg-primary/90"
          >
            Go to Home
          </Button>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-black text-white mb-4">Admin Dashboard</h1>
          <p className="text-slate-300">Manage users, events, and seller applications</p>
        </div>

        {error && (
          <Card className="p-4 bg-red-500/10 border-red-500/50">
            <p className="text-red-400">{error}</p>
            <Button onClick={loadDashboardData} className="mt-2 bg-red-600 hover:bg-red-700">
              Try Again
            </Button>
          </Card>
        )}

        {/* Platform Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="p-4 bg-slate-800 border-slate-700 text-center">
              <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
              <div className="text-slate-300 text-sm">Total Users</div>
            </Card>
            <Card className="p-4 bg-slate-800 border-slate-700 text-center">
              <div className="text-2xl font-bold text-white">{stats.totalSellers}</div>
              <div className="text-slate-300 text-sm">Active Sellers</div>
            </Card>
            <Card className="p-4 bg-slate-800 border-slate-700 text-center">
              <div className="text-2xl font-bold text-white">{stats.totalEvents}</div>
              <div className="text-slate-300 text-sm">Total Events</div>
            </Card>
            <Card className="p-4 bg-slate-800 border-slate-700 text-center">
              <div className="text-2xl font-bold text-white">{stats.activeEvents}</div>
              <div className="text-slate-300 text-sm">Active Events</div>
            </Card>
            <Card className="p-4 bg-slate-800 border-slate-700 text-center">
              <div className="text-2xl font-bold text-white">{stats.pendingApplications}</div>
              <div className="text-slate-300 text-sm">Pending Apps</div>
            </Card>
          </div>
        )}

        {/* Seller Applications */}
        <Card className="p-6 bg-slate-800 border-slate-700">
          <h2 className="text-2xl font-bold text-white mb-4">
            Seller Applications ({applications.length})
          </h2>
          
          {applications.length === 0 ? (
            <p className="text-slate-300 text-center py-8">No seller applications found.</p>
          ) : (
            <div className="space-y-4">
              {applications.map((app: any) => (
                <Card key={app.id} className="p-4 bg-slate-700 border-slate-600">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">{app.business_name}</h3>
                      <p className="text-slate-300">
                        {app.profiles?.full_name || 'Unknown'} ({app.profiles?.email})
                      </p>
                      <p className="text-slate-400 text-sm">
                        Applied: {new Date(app.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge 
                      variant={
                        app.status === 'pending' ? 'default' :
                        app.status === 'approved' ? 'default' : 'secondary'
                      }
                      className={
                        app.status === 'pending' ? 'bg-yellow-600 text-white' :
                        app.status === 'approved' ? 'bg-green-600 text-white' :
                        'bg-red-600 text-white'
                      }
                    >
                      {app.status}
                    </Badge>
                  </div>

                  <div className="text-slate-300 text-sm space-y-1 mb-4">
                    <p><strong>Business Type:</strong> {app.business_type}</p>
                    <p><strong>Contact:</strong> {app.contact_info?.email || 'N/A'}</p>
                    {app.contact_info?.phone && (
                      <p><strong>Phone:</strong> {app.contact_info.phone}</p>
                    )}
                    {app.contact_info?.website && (
                      <p><strong>Website:</strong> {app.contact_info.website}</p>
                    )}
                    {app.contact_info?.description && (
                      <p><strong>Description:</strong> {app.contact_info.description}</p>
                    )}
                  </div>

                  {app.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApproveApplication(app.id)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRejectApplication(app.id)}
                        className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                      >
                        Reject
                      </Button>
                    </div>
                  )}

                  {app.notes && (
                    <div className="mt-2 p-2 bg-slate-600 rounded text-sm text-slate-300">
                      <strong>Notes:</strong> {app.notes}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

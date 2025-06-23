"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/utils/supabase';

export default function TestSellerApplication() {
  const { user, role } = useAuth();
  const [applying, setApplying] = useState(false);
  const [debugResult, setDebugResult] = useState<any>(null);
  const [existingApplications, setExistingApplications] = useState<any[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase().auth.getSession();
      setToken(data.session?.access_token || null);
    };
    checkSession();
  }, []);

  useEffect(() => {
    if (user?.id) {
      checkExistingApplications();
    }
  }, [user]);

  const checkExistingApplications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase()
        .from('seller_applications')
        .select('*')
        .order('applied_at', { ascending: false });

      if (error) {
        console.error("Error fetching applications:", error);
      } else {
        setExistingApplications(data || []);
      }
    } catch (err) {
      console.error("Exception checking applications:", err);
    } finally {
      setLoading(false);
    }
  };

  const applyForSeller = async () => {
    if (!token) {
      alert("No authentication token available. Please refresh the page.");
      return;
    }

    setApplying(true);
    try {
      const response = await fetch('/api/apply-seller', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const result = await response.json();
      setDebugResult(result);
      
      if (response.ok) {
        alert('Application submitted successfully!');
        checkExistingApplications();
      } else {
        alert(`Error: ${result.message || result.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      setDebugResult({ error: String(error) });
    } finally {
      setApplying(false);
    }
  };

  const checkDebugEndpoint = async () => {
    try {
      setLoading(true);
      const url = token 
        ? `/api/debug-seller-applications?token=${token}`
        : '/api/debug-seller-applications';
      
      const response = await fetch(url);
      const result = await response.json();
      setDebugResult(result);
    } catch (error) {
      console.error('Error:', error);
      setDebugResult({ error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  const createDebugProcedures = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/debug-seller-applications', {
        method: 'POST'
      });
      const result = await response.json();
      setDebugResult(result);
      alert(result.success ? 'Debug procedures created!' : 'Failed to create debug procedures');
    } catch (error) {
      console.error('Error:', error);
      setDebugResult({ error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Seller Application Test</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Info</CardTitle>
            <CardDescription>Current user and authentication details</CardDescription>
          </CardHeader>
          <CardContent>
            {user ? (
              <div className="space-y-4">
                <div>
                  <p className="font-semibold">User ID:</p>
                  <p className="text-muted-foreground break-all">{user.id}</p>
                </div>
                <div>
                  <p className="font-semibold">Email:</p>
                  <p className="text-muted-foreground">{user.email}</p>
                </div>
                <div>
                  <p className="font-semibold">Role:</p>
                  <Badge>{role}</Badge>
                </div>
                <div>
                  <p className="font-semibold">Auth Token Available:</p>
                  <Badge variant={token ? "default" : "destructive"}>
                    {token ? "Yes" : "No"}
                  </Badge>
                </div>
              </div>
            ) : (
              <p>Not authenticated</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>Test seller application functionality</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={applyForSeller} 
              disabled={applying || loading}
              className="w-full"
            >
              {applying ? "Applying..." : "Apply for Seller Status"}
            </Button>
            
            <Button 
              onClick={checkExistingApplications} 
              variant="outline" 
              disabled={loading}
              className="w-full"
            >
              Check My Applications
            </Button>
            
            <Button 
              onClick={checkDebugEndpoint} 
              variant="secondary" 
              disabled={loading}
              className="w-full"
            >
              Debug Seller Applications Table
            </Button>
            
            <Button
              onClick={createDebugProcedures}
              variant="destructive"
              disabled={loading}
              className="w-full"
            >
              Create Debug Procedures (Admin)
            </Button>
          </CardContent>
        </Card>
      </div>
      
      {loading && (
        <div className="mt-6 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-2">Loading...</p>
        </div>
      )}
      
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">My Applications</h2>
        {existingApplications.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No applications found
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {existingApplications.map((app) => (
              <Card key={app.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <Badge variant={
                      app.status === 'pending' ? 'secondary' :
                      app.status === 'approved' ? 'default' : 'destructive'
                    }>
                      {app.status.toUpperCase()}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Applied: {new Date(app.applied_at).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="font-semibold">ID:</p>
                      <p className="text-muted-foreground break-all">{app.id}</p>
                    </div>
                    <div>
                      <p className="font-semibold">User ID:</p>
                      <p className="text-muted-foreground break-all">{app.user_id}</p>
                    </div>
                    {app.reviewed_at && (
                      <>
                        <div>
                          <p className="font-semibold">Reviewed:</p>
                          <p className="text-muted-foreground">
                            {new Date(app.reviewed_at).toLocaleString()}
                          </p>
                        </div>
                        {app.reviewed_by && (
                          <div>
                            <p className="font-semibold">Reviewed By:</p>
                            <p className="text-muted-foreground break-all">{app.reviewed_by}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {debugResult && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Debug Results</h2>
          <Card>
            <CardContent className="p-6">
              <pre className="whitespace-pre-wrap text-sm overflow-auto max-h-[500px]">
                {JSON.stringify(debugResult, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

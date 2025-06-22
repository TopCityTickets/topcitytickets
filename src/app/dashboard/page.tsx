"use client";

import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function UserDashboard() {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="mb-4">Please sign in to access your dashboard.</p>
          <Link href="/login">
            <Button>Sign In</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Welcome, {user.email}!</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Browse Events</h2>
          <Link href="/events">
            <Button className="w-full">View Events</Button>
          </Link>
        </Card>
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">My Profile</h2>
          <Link href="/dashboard/profile">
            <Button className="w-full">View Profile</Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
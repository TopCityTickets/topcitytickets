"use client";

import React, { useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { eventActions, CreateEventData } from '@/lib/actions/events';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function CreateEventPage() {
  const { user, isAuthenticated, role } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<CreateEventData>({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    venue: '',
    category: '',
    price: 0,
    capacity: 100,
    max_tickets: 100,
    image_url: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated || !user) {
      setError('You must be logged in to create events');
      return;
    }

    if (role !== 'seller' && role !== 'admin') {
      setError('You must be a seller or admin to create events');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      await eventActions.createEvent(formData, user.id);
      alert('🎉 Event created successfully!');
      router.push('/seller/dashboard');
    } catch (err: any) {
      console.error('Error creating event:', err);
      setError(err.message || 'Error creating event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center bg-slate-800 border-slate-700">
          <h1 className="text-2xl font-bold text-white mb-4">Authentication Required</h1>
          <p className="text-slate-300 mb-6">You must be logged in to create events.</p>
          <Button
            onClick={() => router.push('/login')}
            className="w-full bg-primary hover:bg-primary/90"
          >
            Go to Login
          </Button>
        </Card>
      </div>
    );
  }

  if (role !== 'seller' && role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center bg-slate-800 border-slate-700">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-slate-300 mb-6">You must be a seller to create events.</p>
          <Button
            onClick={() => router.push('/apply-seller')}
            className="w-full bg-primary hover:bg-primary/90"
          >
            Apply to Become a Seller
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-2xl mx-auto">
        <Card className="p-8 bg-slate-800 border-slate-700">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">Create New Event</h1>
            <p className="text-slate-300">Fill out the details for your new event</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Event Title *
                </label>
                <Input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Enter event title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">Select category</option>
                  <option value="music">Music</option>
                  <option value="sports">Sports</option>
                  <option value="theater">Theater</option>
                  <option value="comedy">Comedy</option>
                  <option value="food">Food & Drink</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Describe your event..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Date *
                </label>
                <Input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Time *
                </label>
                <Input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Location *
                </label>
                <Input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="City or area"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Venue *
                </label>
                <Input
                  type="text"
                  name="venue"
                  value={formData.venue}
                  onChange={handleChange}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Venue name"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Ticket Price *
                </label>
                <Input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Capacity *
                </label>
                <Input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="100"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Max Tickets per Person
                </label>
                <Input
                  type="number"
                  name="max_tickets"
                  value={formData.max_tickets}
                  onChange={handleChange}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="10"
                  min="1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Event Image URL
              </label>
              <Input
                type="url"
                name="image_url"
                value={formData.image_url}
                onChange={handleChange}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-primary to-secondary hover:opacity-90 disabled:opacity-50"
              >
                {loading ? 'Creating Event...' : 'Create Event'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

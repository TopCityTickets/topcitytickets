"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { eventActions, Event } from '@/lib/actions/events';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await eventActions.getActiveEvents();
      setEvents(data);
    } catch (err: any) {
      console.error('Error fetching events:', err);
      setError(err.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter((event: Event) => {
    const matchesSearch = 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCity = selectedCity === 'all' || event.location?.toLowerCase().includes(selectedCity);
    const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory;

    return matchesSearch && matchesCity && matchesCategory;
  });

  const cities = ['all', 'topeka', 'lawrence', 'kansas city'];
  const categories = ['all', 'music', 'sports', 'theater', 'comedy', 'other'];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-black to-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-neon-cyan">Loading events...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black to-slate-900">
        <div className="text-center">
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-6 max-w-md">
            <h2 className="text-red-400 text-xl font-bold mb-2">Error Loading Events</h2>
            <p className="text-red-300 mb-4">{error}</p>
            <Button 
              onClick={fetchEvents}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-black to-slate-900">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-neon-cyan mb-2">Discover Events</h1>
          <p className="text-gray-400">Find the hottest events in your area</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-slate-800/50 backdrop-blur-md rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
            />
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white rounded-md p-2"
            >
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city.charAt(0).toUpperCase() + city.slice(1)}
                </option>
              ))}
            </select>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white rounded-md p-2"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Events Grid */}
        {filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event: any) => (
              <Card
                key={event.id}
                className="bg-slate-800/50 backdrop-blur-md border border-neon-cyan/20 hover:border-neon-cyan/50 transition-all overflow-hidden flex flex-col group"
              >
                {event.image_url && (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={event.image_url}
                      alt={event.title}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="p-4 flex-1 space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold text-neon-cyan mb-1">{event.title}</h2>
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="bg-cyan-950/50 text-neon-cyan">
                        {event.category}
                      </Badge>
                      {event.city && (
                        <Badge variant="secondary" className="bg-pink-950/50 text-neon-pink">
                          {event.city}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm">
                    {new Date(event.date).toLocaleDateString()} @ {event.time}
                  </p>
                  <p className="text-gray-300 text-sm line-clamp-3">{event.description}</p>
                </div>
                <div className="p-4 border-t border-neon-cyan/20">
                  <Link href={`/events/${event.id}`}>
                    <Button 
                      className="w-full bg-slate-700 hover:bg-slate-600 text-neon-cyan border border-neon-cyan/50 hover:border-neon-cyan"
                      variant="outline"
                    >
                      View Details →
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400">No events found matching your criteria.</p>
            <Button 
              onClick={() => {
                setSearchQuery('');
                setSelectedCity('all');
                setSelectedCategory('all');
              }}
              className="mt-4 text-neon-pink border-neon-pink hover:bg-pink-950/50"
              variant="outline"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

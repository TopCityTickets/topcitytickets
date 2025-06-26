"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/utils/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchIcon, CalendarIcon, MapPinIcon, FilterIcon, GridIcon, ListIcon } from "lucide-react";
import EventCard from "@/components/events/event-card";
import type { Event } from '@/types';

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "name" | "price">("date");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Filter and sort events based on search query and sort option
  const filteredAndSortedEvents = useMemo(() => {
    let filtered = events;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = events.filter(event => 
        event.name?.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query) ||
        event.venue?.toLowerCase().includes(query) ||
        event.organizer_email?.toLowerCase().includes(query)
      );
    }

    // Sort events
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return (a.name || "").localeCompare(b.name || "");
        case "price":
          return (a.ticket_price || 0) - (b.ticket_price || 0);
        case "date":
        default:
          return new Date(a.date || "").getTime() - new Date(b.date || "").getTime();
      }
    });
  }, [events, searchQuery, sortBy]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data, error } = await supabase()
          .from('events')
          .select('*')
          .eq('is_approved', true)
          .order('date', { ascending: true });
        
        if (error) {
          console.error('Error fetching events:', error);
        } else if (Array.isArray(data)) {
          setEvents(data);
        }
      } catch (error) {
        console.error('Fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <div className="h-10 w-64 loading-shimmer rounded mb-4"></div>
              <div className="h-6 w-96 loading-shimmer rounded"></div>
            </div>
            <div className="search-container p-6 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="h-10 flex-1 loading-shimmer rounded"></div>
                <div className="h-10 w-48 loading-shimmer rounded"></div>
                <div className="h-10 w-20 loading-shimmer rounded"></div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="ultra-dark-card overflow-hidden">
                  <div className="h-48 loading-shimmer"></div>
                  <div className="p-6 space-y-3">
                    <div className="h-6 loading-shimmer rounded"></div>
                    <div className="h-4 loading-shimmer rounded w-3/4"></div>
                    <div className="h-4 loading-shimmer rounded w-1/2"></div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (events.length === 0) {
    return (
      <div className="min-h-screen bg-black">
        <div className="container mx-auto px-4 py-16">
          <Card className="ultra-dark-card p-8 text-center max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-4 brand-text-gradient">No Events Currently Available</h1>
            <p className="text-muted-foreground mb-6">
              Please check back regularly for upcoming events. Follow us on social media to stay informed about new ticket releases and events.
            </p>
            <div className="space-x-4">
              <Button asChild variant="outline">
                <a href="https://twitter.com/topcitytickets" target="_blank" rel="noopener noreferrer">
                  Follow on Twitter
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href="https://instagram.com/topcitytickets" target="_blank" rel="noopener noreferrer">
                  Follow on Instagram
                </a>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 brand-text-gradient">Upcoming Events</h1>
          <p className="text-muted-foreground mb-6">Discover amazing events happening in your city</p>
            {/* Search and Filter Bar */}
          <div className="search-container p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Input */}
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search events, venues, or organizers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 search-input ultra-dark-card border-primary/30 focus:border-primary/60"
                />
              </div>
              
              {/* Sort Dropdown */}
              <Select value={sortBy} onValueChange={(value: "date" | "name" | "price") => setSortBy(value)}>
                <SelectTrigger className="w-full md:w-48 ultra-dark-card border-primary/30">
                  <FilterIcon className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Sort by Date</SelectItem>
                  <SelectItem value="name">Sort by Name</SelectItem>
                  <SelectItem value="price">Sort by Price</SelectItem>
                </SelectContent>
              </Select>
              
              {/* View Mode Toggle */}
              <div className="view-toggle flex p-1">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className={`h-8 px-3 ${viewMode === "grid" ? "active" : ""}`}
                >
                  <GridIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={`h-8 px-3 ${viewMode === "list" ? "active" : ""}`}
                >
                  <ListIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Results Count */}
            <div className="mt-4 flex justify-between items-center text-sm text-muted-foreground">
              <p>
                {searchQuery ? `${filteredAndSortedEvents.length} events found` : `${events.length} total events`}
              </p>
              {searchQuery && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSearchQuery("")}
                  className="text-primary hover:text-primary/80"
                >
                  Clear search
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Events Grid/List */}
        <div className={
          viewMode === "grid" 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
            : "space-y-4"
        }>
          {filteredAndSortedEvents.map((event) => (
            <EventCard key={event.id} event={event} viewMode={viewMode} />
          ))}
        </div>
        
        {filteredAndSortedEvents.length === 0 && searchQuery && (
          <div className="text-center py-12">
            <Card className="ultra-dark-card p-8 max-w-md mx-auto">
              <SearchIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No events found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search terms or browse all events.
              </p>
              <Button 
                variant="outline" 
                onClick={() => setSearchQuery("")}
                className="dark-button-glow"
              >
                Clear Search
              </Button>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
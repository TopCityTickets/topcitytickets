"use client";

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  venue: string;
  category: string;
  price: number;
  capacity: number;
  tickets_sold: number;
  max_tickets: number;
  status: 'active' | 'cancelled' | 'completed';
  seller_id: string;
  created_by: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateEventData {
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  venue: string;
  category: string;
  price: number;
  capacity: number;
  max_tickets: number;
  image_url?: string;
}

export const eventActions = {
  // Get all active events
  getActiveEvents: async () => {
    const supabase = createClientComponentClient();
    
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'active')
      .order('date', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return data as Event[];
  },

  // Get events by seller
  getEventsBySeller: async (sellerId: string) => {
    const supabase = createClientComponentClient();
    
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('seller_id', sellerId)
      .order('date', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return data as Event[];
  },

  // Get single event
  getEvent: async (eventId: string) => {
    const supabase = createClientComponentClient();
    
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data as Event;
  },

  // Create new event
  createEvent: async (eventData: CreateEventData, userId: string) => {
    const supabase = createClientComponentClient();
    
    const { data, error } = await supabase
      .from('events')
      .insert({
        ...eventData,
        seller_id: userId,
        created_by: userId,
        status: 'active',
        tickets_sold: 0,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data as Event;
  },

  // Update event
  updateEvent: async (eventId: string, updates: Partial<CreateEventData>) => {
    const supabase = createClientComponentClient();
    
    const { data, error } = await supabase
      .from('events')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data as Event;
  },

  // Delete event
  deleteEvent: async (eventId: string) => {
    const supabase = createClientComponentClient();
    
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);

    if (error) {
      throw new Error(error.message);
    }
  },

  // Cancel event
  cancelEvent: async (eventId: string) => {
    const supabase = createClientComponentClient();
    
    const { data, error } = await supabase
      .from('events')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', eventId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data as Event;
  },
};

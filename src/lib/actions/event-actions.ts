import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export const eventActions = {
  async cancelEvent(eventId: string) {
    const supabase = createClientComponentClient();
    const { error } = await supabase
      .from('events')
      .update({ status: 'cancelled' })
      .eq('id', eventId);

    if (error) {
      throw new Error(error.message);
    }
  },

  async createEvent(eventData: any) {
    const supabase = createClientComponentClient();
    const { data, error } = await supabase
      .from('events')
      .insert([eventData])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  async updateEvent(eventId: string, eventData: any) {
    const supabase = createClientComponentClient();
    const { data, error } = await supabase
      .from('events')
      .update(eventData)
      .eq('id', eventId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }
};

// Supabase Storage Helper Functions
// Use these if you want to upload event images to Supabase Storage

import { supabase } from '@/utils/supabase';

export async function uploadEventImage(file: File, eventSlug: string): Promise<string | null> {
  const supabaseClient = supabase();
  
  // Create unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${eventSlug}-${Date.now()}.${fileExt}`;
  
  try {
    // Upload file to Supabase Storage
    const { data, error } = await supabaseClient.storage
      .from('event-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabaseClient.storage
      .from('event-images')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Upload failed:', error);
    return null;
  }
}

export async function deleteEventImage(imageUrl: string): Promise<boolean> {
  const supabaseClient = supabase();
  
  try {
    // Extract filename from URL
    const fileName = imageUrl.split('/').pop();
    if (!fileName) return false;

    const { error } = await supabaseClient.storage
      .from('event-images')
      .remove([fileName]);

    return !error;
  } catch (error) {
    console.error('Delete failed:', error);
    return false;
  }
}

// Example usage in your event submission form:
/*
const handleImageUpload = async (file: File) => {
  const imageUrl = await uploadEventImage(file, eventSlug);
  if (imageUrl) {
    // Save imageUrl to your event record
    setEventData(prev => ({ ...prev, image_url: imageUrl }));
  }
};
*/

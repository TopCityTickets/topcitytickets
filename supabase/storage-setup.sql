-- Supabase Storage Setup for Event Images
-- Run this in your Supabase SQL Editor if you want user-uploaded event images

-- Create a storage bucket for event images
INSERT INTO storage.buckets (id, name, public) VALUES ('event-images', 'Event Images', true);

-- Allow public access to event images
CREATE POLICY "Event images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-images');

-- Allow authenticated users to upload event images
CREATE POLICY "Users can upload event images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'event-images' AND auth.role() = 'authenticated');

-- Allow users to update their own event images
CREATE POLICY "Users can update own event images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'event-images' AND auth.uid()::text = owner);

-- Allow users to delete their own event images
CREATE POLICY "Users can delete own event images"
ON storage.objects FOR DELETE
USING (bucket_id = 'event-images' AND auth.uid()::text = owner);

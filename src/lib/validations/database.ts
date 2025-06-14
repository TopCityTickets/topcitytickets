import { z } from 'zod';

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  role: z.enum(['user', 'seller', 'admin']),
  created_at: z.string(),
});

export const eventSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string(),
  date: z.string(),
  time: z.string(),
  venue: z.string(),
  ticket_price: z.number().positive(),
  image_url: z.string().nullable().optional(),
  slug: z.string(),
  organizer_email: z.string().email(),
});

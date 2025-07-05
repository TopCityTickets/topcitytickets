import { z } from 'zod';

export const eventFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  venue: z.string().min(1, 'Venue is required'),
  ticket_price: z.number().positive('Ticket price must be greater than 0'),
  image_url: z.string().nullable().optional(),
  organizer_email: z.string().email('Invalid email address'),
});

export type EventFormData = z.infer<typeof eventFormSchema>;

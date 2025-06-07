CREATE TABLE approved_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  date date NOT NULL,
  time text NOT NULL,
  venue text NOT NULL,
  imageUrl text,
  slug text,
  organizerEmail text,
  ticketPrice numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc', now())
);

-- Drop old tables to start fresh
DROP TABLE IF EXISTS approved_events;
DROP TABLE IF EXISTS event_submissions;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS users;

-- Create users table with roles
CREATE TABLE users (
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  email text,
  role text DEFAULT 'user' NOT NULL
);

-- Create event_submissions table
CREATE TABLE event_submissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  date text NOT NULL,
  time text NOT NULL,
  venue text NOT NULL,
  ticket_price numeric NOT NULL,
  image_url text,
  slug text,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  organizer_email text,
  status text DEFAULT 'pending' NOT NULL, -- pending, approved, rejected
  admin_feedback text,
  created_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL
);

-- Create the `events` table to store approved events
CREATE TABLE events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  date text NOT NULL,
  time text NOT NULL,
  venue text NOT NULL,
  ticket_price numeric NOT NULL,
  image_url text,
  slug text UNIQUE,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  organizer_email text,
  is_approved boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL
);

-- RLS for users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Can view own user data." ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Can update own user data." ON users FOR UPDATE USING (auth.uid() = id);

-- Function to create a user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (new.id, new.email, 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- RLS for event_submissions
ALTER TABLE event_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert their own submissions." ON event_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own submissions." ON event_submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all submissions." ON event_submissions FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- RLS for events
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Events are public." ON events FOR SELECT USING (true);
CREATE POLICY "Admins can manage events." ON events FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

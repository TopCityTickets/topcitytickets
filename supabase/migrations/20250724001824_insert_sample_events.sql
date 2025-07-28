-- Insert sample events for testing
INSERT INTO public.events (
  title, 
  description, 
  date, 
  time, 
  location, 
  price, 
  capacity, 
  tickets_sold, 
  status,
  category,
  venue
) VALUES 
(
  'Top City Music Festival 2025',
  'The biggest music festival in the city featuring top artists from around the world. Join us for an unforgettable experience with multiple stages, food trucks, and amazing performances.',
  '2025-08-15',
  '18:00:00',
  'Central Park Amphitheater',
  89.99,
  5000,
  1250,
  'active',
  'Music',
  'Central Park Amphitheater'
),
(
  'Comedy Night Downtown',
  'Laugh until your sides hurt with the best stand-up comedians in the city. Special guest appearances and drink specials all night long.',
  '2025-07-30',
  '20:00:00',
  'Downtown Comedy Club',
  25.00,
  200,
  45,
  'active',
  'Comedy',
  'Downtown Comedy Club'
),
(
  'Tech Startup Pitch Night',
  'Watch innovative startups pitch their ideas to leading investors. Network with entrepreneurs, investors, and tech enthusiasts.',
  '2025-08-05',
  '19:00:00',
  'Innovation Hub',
  15.00,
  150,
  67,
  'active',
  'Business',
  'Innovation Hub'
),
(
  'Art Gallery Opening - Modern Expressions',
  'Celebrate the opening of our newest exhibition featuring contemporary artists from the region. Wine, cheese, and incredible art await.',
  '2025-07-28',
  '17:30:00',
  'Metropolitan Art Gallery',
  0.00,
  100,
  23,
  'active',
  'Art',
  'Metropolitan Art Gallery'
),
(
  'Food Truck Festival',
  'Sample delicious food from over 30 food trucks, live music, and family-friendly activities. Perfect for a weekend outing.',
  '2025-08-10',
  '11:00:00',
  'Riverside Park',
  10.00,
  2000,
  456,
  'active',
  'Food',
  'Riverside Park'
);

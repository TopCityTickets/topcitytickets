#!/bin/bash

# TopCityTickets Deployment Script

echo "Cleaning up previous build artifacts..."
rm -rf .next
rm -rf node_modules
rm -f package-lock.json

echo "Clearing npm cache..."
npm cache clean --force

echo "Installing dependencies..."
npm install

echo "Building project..."
npm run build

if [ $? -eq 0 ]; then
  echo "Build successful! Deploying to Vercel..."
  vercel --prod
else
  echo "Build failed. Please check the errors above."
  exit 1
fi

echo "Deployment complete!"
echo "Remember to configure these environment variables in Vercel:"
echo "- NEXT_PUBLIC_SUPABASE_URL"
echo "- NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "- NEXT_PUBLIC_SITE_URL"
echo "- SUPABASE_SERVICE_ROLE_KEY"
#!/bin/bash

# Deploy to Vercel with correct environment variables
echo "🚀 Deploying to Vercel with stable domain configuration..."

# Set environment variables for production
echo "📝 Setting environment variables..."
vercel env add NEXT_PUBLIC_SITE_URL production
# When prompted, enter: https://topcitytickets.org

# Deploy
echo "🚀 Deploying to production..."
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🔧 Next steps:"
echo "1. Go to your Supabase Dashboard → Authentication → URL Configuration"
echo "2. Add these redirect URLs:"
echo "   - https://topcitytickets.org/auth/callback"
echo "   - https://topcitytickets.vercel.app/auth/callback"
echo "3. Set Site URL to: https://topcitytickets.org"
echo ""
echo "🧪 Test the auth flow at: https://topcitytickets.org/signup"

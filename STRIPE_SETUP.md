# 🎫 Stripe Payment Setup Guide

## Step 1: Create Stripe Account
1. Go to https://stripe.com and create an account
2. Go to the Stripe Dashboard
3. Make sure you're in **TEST MODE** (toggle in top right)

## Step 2: Get Your API Keys
1. In Stripe Dashboard, go to **Developers > API keys**
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Copy your **Secret key** (starts with `sk_test_`)

## Step 3: Add Environment Variables
Add these to your `.env.local` file:

```bash
# Stripe Keys (TEST MODE)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

## Step 4: Create Webhook Endpoint
1. In Stripe Dashboard, go to **Developers > Webhooks**
2. Click **Add endpoint**
3. Set endpoint URL to: `https://your-domain.vercel.app/api/stripe-webhook`
4. Select events: `checkout.session.completed`
5. Copy the **Signing secret** (starts with `whsec_`)
6. Add it to your `.env.local` as `STRIPE_WEBHOOK_SECRET`

## Step 5: Test Payments
Use these test card numbers:
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- Any future expiry date, any CVC

## Step 6: Database Setup
Run this SQL in Supabase to create the tickets table:

```sql
-- (The create-tickets-table.sql content we created)
```

## Step 7: Deploy to Vercel
Add the environment variables to your Vercel project settings.

## 🎯 Features Included:
- ✅ Secure Stripe Checkout
- ✅ Automatic ticket generation
- ✅ User dashboard with tickets
- ✅ Duplicate purchase prevention
- ✅ Payment verification via webhooks
- ✅ Ticket status tracking

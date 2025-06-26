# 🎟️ Live Ticket Purchase Test Guide

## Current Production URL
Your app is deployed at: https://topcitytickets.org

## Step 1: Update Stripe Webhook URL

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers > Webhooks**
3. Find your existing webhook or create a new one
4. Set the endpoint URL to: 
   ```
   https://topcitytickets.org/api/stripe-webhook
   ```
5. Make sure these events are selected:
   - `checkout.session.completed`

## Step 2: Test the Purchase Flow

1. **Visit the live app**: https://topcitytickets.org
2. **Log in** (or sign up if needed)
3. **Go to the Church Coin event**: https://topcitytickets.org/events/church-coin
4. **Click "Purchase Ticket"**
5. **Complete the Stripe checkout** using test card: `4242 4242 4242 4242`

## Step 3: Verify Success

After successful payment:
1. You should be redirected back to the dashboard
2. Your ticket should appear in the dashboard
3. Check the Stripe dashboard to see the payment

## Test Cards (for Stripe Test Mode)
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **Requires Authentication**: 4000 0000 0000 3220

## If You're Using Live Mode
⚠️ **Warning**: You're currently using live Stripe keys. For testing, switch to test keys:
- Change `pk_live_` to `pk_test_` 
- Change `sk_live_` to `sk_test_`
- Get a test webhook secret

## Debug URL
If you need to debug: https://topcitytickets.org/test-buy-ticket

---

The main issue was that Stripe webhooks require a publicly accessible URL - localhost doesn't work. Now that we're deployed to Vercel, the webhooks should work properly!

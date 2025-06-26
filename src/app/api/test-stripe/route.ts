import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function GET() {
  try {
    // Test Stripe connection
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2025-05-28.basil',
    });

    // Simple test - list products (this will fail if API key is wrong)
    const products = await stripe.products.list({ limit: 1 });

    return NextResponse.json({
      success: true,
      message: 'Stripe connection successful',
      hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
      hasPublishableKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      productCount: products.data.length,
    });

  } catch (error: any) {
    console.error('Stripe test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
      hasPublishableKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    }, { status: 500 });
  }
}

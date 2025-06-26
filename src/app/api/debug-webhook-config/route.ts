import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    webhookSecretLength: process.env.STRIPE_WEBHOOK_SECRET?.length || 0,
    webhookSecretPrefix: process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 10) || 'none',
  });
}

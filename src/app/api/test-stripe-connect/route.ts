import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const requiredEnvVars = {
      'STRIPE_SECRET_KEY': process.env.STRIPE_SECRET_KEY ? '✅ Set' : '❌ Missing',
      'STRIPE_CONNECT_CLIENT_ID': process.env.STRIPE_CONNECT_CLIENT_ID ? '✅ Set' : '❌ Missing',
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY': process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? '✅ Set' : '❌ Missing',
      'PLATFORM_FEE_PERCENTAGE': process.env.PLATFORM_FEE_PERCENTAGE ? '✅ Set' : '❌ Missing'
    };

    const allConfigured = Object.values(requiredEnvVars).every(status => status.includes('✅'));

    return NextResponse.json({
      message: 'Stripe Connect Configuration Check',
      environment_variables: requiredEnvVars,
      stripe_connect_ready: allConfigured,
      client_id_preview: process.env.STRIPE_CONNECT_CLIENT_ID ? 
        `${process.env.STRIPE_CONNECT_CLIENT_ID.substring(0, 10)}...` : 'Not set'
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Configuration check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

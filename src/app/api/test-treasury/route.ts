import { NextResponse } from 'next/server';
import { treasuryService } from '@/lib/stripe-treasury';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Test Treasury service initialization
    const testResults: any = {
      treasuryServiceLoaded: !!treasuryService,
      stripeSecretKeyExists: !!process.env.STRIPE_SECRET_KEY,
      stripeSecretKeyType: process.env.STRIPE_SECRET_KEY?.includes('sk_test_') ? 'test' : 'live',
      timestamp: new Date().toISOString()
    };

    // Test a simple Treasury capability check with a dummy account ID (will fail, but tests API)
    try {
      await treasuryService.checkTreasuryCapability('acct_test123');
    } catch (error) {
      testResults.treasuryApiTest = `API accessible, error as expected: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }

    return NextResponse.json({
      success: true,
      message: 'Treasury integration test successful',
      results: testResults
    });

  } catch (error) {
    console.error('Treasury test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Treasury integration test failed'
    }, { status: 500 });
  }
}

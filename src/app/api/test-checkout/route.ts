import { NextRequest, NextResponse } from 'next/server';

// Force dynamic generation for this API route
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Test the create-checkout endpoint
    const testEventId = 'bbbf6e59-cd48-479f-a9f3-22e9871c65e9'; // Church Coin event
    
    // We need a valid user session to test this properly
    const response = await fetch('http://localhost:3007/api/create-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: We would need a real auth token here
        'Authorization': 'Bearer test_token_placeholder'
      },
      body: JSON.stringify({ eventId: testEventId }),
    });

    const result = await response.json();

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      result: result,
    });

  } catch (error: any) {
    console.error('Checkout test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
